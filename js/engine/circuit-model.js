/**
 * Canonical Circuit Data Model & State Store
 * Single source of truth for schematic topology, electrical connectivity,
 * netlist generation, transactional history, and project persistence.
 */

export class CircuitModel {
  constructor() {
    this.schemaVersion = '2.0';
    this.name = 'Untitled Circuit';
    this.components = [];
    this.wires = [];
    this.netLabels = []; // { id, name, x, y, netId }
    this.probes = [];
    
    // Topology and connectivity caches
    this.nets = []; // Array of sets of pin keys
    this.pinToNetMap = new Map(); // pinKey -> netIndex (0 = GND)
    
    // Transactional Undo / Redo
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 60;
    this.transactionDepth = 0;
    this.pendingSnapshot = null;

    // Listeners
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(changeType, data) {
    this.buildConnectivity();
    for (const listener of this.listeners) {
      try {
        listener(changeType, data);
      } catch (err) {
        console.error('Error in CircuitModel listener:', err);
      }
    }
  }

  // --- Transactional State Management ---
  beginTransaction() {
    if (this.transactionDepth === 0) {
      this.pendingSnapshot = this.serialize();
    }
    this.transactionDepth++;
  }

  commitTransaction() {
    if (this.transactionDepth > 0) {
      this.transactionDepth--;
      if (this.transactionDepth === 0 && this.pendingSnapshot) {
        this.undoStack.push(this.pendingSnapshot);
        if (this.undoStack.length > this.maxHistory) {
          this.undoStack.shift();
        }
        this.redoStack = [];
        this.pendingSnapshot = null;
        this.saveToLocalStorage();
      }
    }
  }

  rollbackTransaction() {
    if (this.pendingSnapshot) {
      this.deserialize(this.pendingSnapshot, false);
      this.pendingSnapshot = null;
    }
    this.transactionDepth = 0;
  }

  saveSnapshot() {
    const snapshot = this.serialize();
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.saveToLocalStorage();
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const current = this.serialize();
    this.redoStack.push(current);
    const prev = this.undoStack.pop();
    this.deserialize(prev, false);
    this.notify('undo', null);
    this.saveToLocalStorage();
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const current = this.serialize();
    this.undoStack.push(current);
    const next = this.redoStack.pop();
    this.deserialize(next, false);
    this.notify('redo', null);
    this.saveToLocalStorage();
    return true;
  }

  // --- Topology & Netlist Resolver ---
  buildConnectivity() {
    const pinAdjacency = new Map();

    const addEdge = (p1, p2) => {
      if (!pinAdjacency.has(p1)) pinAdjacency.set(p1, new Set());
      if (!pinAdjacency.has(p2)) pinAdjacency.set(p2, new Set());
      pinAdjacency.get(p1).add(p2);
      pinAdjacency.get(p2).add(p1);
    };

    // 1. Register all component pins
    this.components.forEach(comp => {
      if (Array.isArray(comp.pins)) {
        comp.pins.forEach(pin => {
          const pinKey = `${comp.id}:${pin.id}`;
          if (!pinAdjacency.has(pinKey)) {
            pinAdjacency.set(pinKey, new Set());
          }
        });
      }
    });

    // 2. Connect physical wires
    this.wires.forEach(wire => {
      if (wire.fromPin && wire.toPin) {
        addEdge(wire.fromPin, wire.toPin);
      }
    });

    // 3. Connect Named Net Labels and Power Rails
    // Power rails (GND, VCC, +5V, +12V, -12V, +15V, -15V) and custom net labels
    const namedNetGroups = new Map();
    this.components.forEach(comp => {
      let netTag = null;
      if (comp.type === 'GROUND' || comp.type === 'GND') netTag = 'GND';
      else if (comp.type === 'POWER_VCC') netTag = 'VCC';
      else if (comp.type === 'POWER_VDD') netTag = 'VDD';
      else if (comp.type === 'POWER_VSS') netTag = 'VSS';
      else if (comp.type === 'POWER_5V') netTag = '+5V';
      else if (comp.type === 'POWER_12V') netTag = '+12V';
      else if (comp.type === 'POWER_NEG12V') netTag = '-12V';
      else if (comp.type === 'POWER_15V') netTag = '+15V';
      else if (comp.type === 'POWER_NEG15V') netTag = '-15V';
      else if (comp.type === 'NET_LABEL' && comp.params?.label) {
        netTag = comp.params.label.trim().toUpperCase();
      }

      if (netTag && comp.pins && comp.pins.length > 0) {
        const pinKey = `${comp.id}:${comp.pins[0].id}`;
        if (!namedNetGroups.has(netTag)) namedNetGroups.set(netTag, []);
        namedNetGroups.get(netTag).push(pinKey);
      }
    });

    // Connect all pins in the same named net group together
    namedNetGroups.forEach((pinList) => {
      if (pinList.length > 1) {
        for (let i = 1; i < pinList.length; i++) {
          addEdge(pinList[0], pinList[i]);
        }
      }
    });

    // 4. Connected Components traversal (BFS)
    const visited = new Set();
    const rawNets = [];
    let gndNetIndex = -1;

    // Identify all GND pins
    const gndPinKeys = new Set(namedNetGroups.get('GND') || []);
    this.components.forEach(comp => {
      if (comp.type === 'GROUND' || comp.type === 'GND') {
        comp.pins.forEach(p => gndPinKeys.add(`${comp.id}:${p.id}`));
      }
    });

    for (const [pinKey] of pinAdjacency) {
      if (!visited.has(pinKey)) {
        const net = [];
        const queue = [pinKey];
        visited.add(pinKey);
        let containsGnd = false;

        while (queue.length > 0) {
          const curr = queue.shift();
          net.push(curr);
          if (gndPinKeys.has(curr)) containsGnd = true;

          const neighbors = pinAdjacency.get(curr) || [];
          for (const next of neighbors) {
            if (!visited.has(next)) {
              visited.add(next);
              queue.push(next);
            }
          }
        }

        if (containsGnd && gndNetIndex === -1) {
          gndNetIndex = rawNets.length;
        }
        rawNets.push(net);
      }
    }

    // Assign Node 0 to Ground
    this.pinToNetMap.clear();
    this.nets = [];

    if (gndNetIndex !== -1) {
      const gndNet = rawNets.splice(gndNetIndex, 1)[0];
      rawNets.unshift(gndNet);
    } else {
      // If no explicit GND is placed, synthesize node 0 as ground
      rawNets.unshift([]);
    }

    rawNets.forEach((net, nodeIdx) => {
      this.nets.push(net);
      net.forEach(pinKey => {
        this.pinToNetMap.set(pinKey, nodeIdx);
      });
    });
  }

  getPinNet(comp, pinId) {
    const key = `${comp.id}:${pinId}`;
    return this.pinToNetMap.get(key) ?? -1;
  }

  // --- Serialization & LocalStorage ---
  serialize() {
    return JSON.stringify({
      schemaVersion: this.schemaVersion,
      name: this.name,
      components: this.components,
      wires: this.wires,
      netLabels: this.netLabels,
      timestamp: Date.now()
    });
  }

  deserialize(jsonStr, saveHistory = true) {
    if (saveHistory) this.saveSnapshot();
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      this.name = data.name || 'Untitled Circuit';
      this.components = Array.isArray(data.components) ? data.components : [];
      this.wires = Array.isArray(data.wires) ? data.wires : [];
      this.netLabels = Array.isArray(data.netLabels) ? data.netLabels : [];
      this.buildConnectivity();
      return true;
    } catch (err) {
      console.error('Failed to deserialize circuit:', err);
      return false;
    }
  }

  saveToLocalStorage(key = 'multisim_autosave_circuit') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, this.serialize());
      }
    } catch (e) {
      // Ignore quota exceeded errors
    }
  }

  loadFromLocalStorage(key = 'multisim_autosave_circuit') {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        if (data) {
          return this.deserialize(data, false);
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }
}
