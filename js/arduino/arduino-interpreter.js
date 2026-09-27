/**
 * e-Samastha — Arduino C++ AST Tokenizer, Parser & Cooperative Virtual Machine
 * 
 * Production Embedded Systems Engine: Strictly 0 eval() and 0 new Function().
 * Features:
 * - Robust AST Tokenizer & Recursive Descent Parser for Arduino C++
 * - Cooperative generator-based execution allowing non-blocking delay()
 * - Instruction budget per frame to prevent browser freeze on infinite loops
 * - Complete Arduino standard API (GPIO, PWM, ADC, Timing, Math, Bits, Pulse, Tone)
 * - Enhanced Peripherals: Serial (RX/TX), Servo (SG90), LiquidCrystal (HD44780), OLED (SSD1306), DHT Sensor
 * - Actionable Student-Friendly Compiler Diagnostics
 */

import { PinMode, PinValue } from './arduino-board.js';

// --- Token Types ---
export const TokenType = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  CHAR: 'CHAR',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  EOF: 'EOF'
};

const KEYWORDS = new Set([
  'void', 'int', 'long', 'short', 'float', 'double', 'char', 'bool', 'boolean', 'byte',
  'unsigned', 'signed', 'const', 'static', 'auto', 'String',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'true', 'false', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'INPUT_PULLDOWN',
  'class', 'struct', 'new', 'sizeof'
]);

// --- Tokenizer ---
export class ArduinoTokenizer {
  constructor(source) {
    this.originalSource = source;
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.defines = new Map();
  }

  tokenize() {
    const tokens = [];
    this.preprocess();

    while (this.pos < this.source.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];
      const startLine = this.line;
      const startCol = this.col;

      // Numbers
      if (this.isDigit(ch) || (ch === '.' && this.isDigit(this.peek(1)))) {
        tokens.push(this.readNumber(startLine, startCol));
        continue;
      }

      // Identifiers / Keywords
      if (this.isAlphaOrUnderscore(ch)) {
        tokens.push(this.readIdentifier(startLine, startCol));
        continue;
      }

      // Strings
      if (ch === '"') {
        tokens.push(this.readString(startLine, startCol));
        continue;
      }

      // Characters
      if (ch === '\'') {
        tokens.push(this.readChar(startLine, startCol));
        continue;
      }

      // Multi-character operators
      const twoChar = ch + this.peek(1);
      const threeChar = twoChar + this.peek(2);

      if (['<<=', '>>='].includes(threeChar)) {
        this.advance(3);
        tokens.push({ type: TokenType.OPERATOR, value: threeChar, line: startLine, col: startCol });
        continue;
      }

      if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '->', '::'].includes(twoChar)) {
        this.advance(2);
        tokens.push({ type: TokenType.OPERATOR, value: twoChar, line: startLine, col: startCol });
        continue;
      }

      // Single-character operators & punctuation
      if ('+-*/%^&|~!<>='.includes(ch)) {
        this.advance(1);
        tokens.push({ type: TokenType.OPERATOR, value: ch, line: startLine, col: startCol });
        continue;
      }

      if ('(){}[];,?:.'.includes(ch)) {
        this.advance(1);
        tokens.push({ type: TokenType.PUNCTUATION, value: ch, line: startLine, col: startCol });
        continue;
      }

      // Unknown character - skip
      this.advance(1);
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line, col: this.col });
    return tokens;
  }

  preprocess() {
    const lines = this.source.split(/\r?\n/);
    const outputLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#define')) {
        const parts = line.substring(7).trim().split(/\s+/);
        if (parts.length >= 2) {
          const key = parts[0];
          const val = parts.slice(1).join(' ').replace(/;$/, '');
          this.defines.set(key, val);
        }
        outputLines.push('');
      } else if (line.startsWith('#include')) {
        outputLines.push('');
      } else {
        outputLines.push(lines[i]);
      }
    }

    let processed = outputLines.join('\n');
    for (const [key, val] of this.defines.entries()) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      processed = processed.replace(regex, val);
    }
    this.source = processed;
  }

  peek(offset = 0) {
    const idx = this.pos + offset;
    return idx < this.source.length ? this.source[idx] : '';
  }

  advance(count = 1) {
    for (let i = 0; i < count; i++) {
      if (this.source[this.pos] === '\n') {
        this.line++;
        this.col = 1;
      } else {
        this.col++;
      }
      this.pos++;
    }
  }

  isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  isAlphaOrUnderscore(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  skipWhitespaceAndComments() {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];

      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advance(1);
        continue;
      }

      if (ch === '/' && this.peek(1) === '/') {
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.advance(1);
        }
        continue;
      }

      if (ch === '/' && this.peek(1) === '*') {
        this.advance(2);
        while (this.pos < this.source.length) {
          if (this.source[this.pos] === '*' && this.peek(1) === '/') {
            this.advance(2);
            break;
          }
          this.advance(1);
        }
        continue;
      }

      break;
    }
  }

  readNumber(startLine, startCol) {
    let str = '';
    if (this.source[this.pos] === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      str += this.source[this.pos] + this.peek(1);
      this.advance(2);
      while (this.pos < this.source.length && /[0-9a-fA-F]/.test(this.source[this.pos])) {
        str += this.source[this.pos];
        this.advance(1);
      }
      return { type: TokenType.NUMBER, value: parseInt(str, 16), raw: str, line: startLine, col: startCol };
    }

    if (this.source[this.pos] === '0' && (this.peek(1) === 'b' || this.peek(1) === 'B')) {
      str += this.source[this.pos] + this.peek(1);
      this.advance(2);
      while (this.pos < this.source.length && (this.source[this.pos] === '0' || this.source[this.pos] === '1')) {
        str += this.source[this.pos];
        this.advance(1);
      }
      return { type: TokenType.NUMBER, value: parseInt(str.substring(2), 2), raw: str, line: startLine, col: startCol };
    }

    let isFloat = false;
    while (this.pos < this.source.length) {
      const c = this.source[this.pos];
      if (this.isDigit(c)) {
        str += c;
        this.advance(1);
      } else if (c === '.' && !isFloat) {
        isFloat = true;
        str += c;
        this.advance(1);
      } else {
        break;
      }
    }

    while (this.pos < this.source.length && /[fFuUlL]/.test(this.source[this.pos])) {
      this.advance(1);
    }

    const val = isFloat ? parseFloat(str) : parseInt(str, 10);
    return { type: TokenType.NUMBER, value: val, raw: str, line: startLine, col: startCol };
  }

  readIdentifier(startLine, startCol) {
    let str = '';
    while (this.pos < this.source.length && (this.isAlphaOrUnderscore(this.source[this.pos]) || this.isDigit(this.source[this.pos]))) {
      str += this.source[this.pos];
      this.advance(1);
    }
    const type = KEYWORDS.has(str) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
    return { type, value: str, line: startLine, col: startCol };
  }

  readString(startLine, startCol) {
    this.advance(1);
    let str = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance(1);
        const esc = this.source[this.pos];
        if (esc === 'n') str += '\n';
        else if (esc === 't') str += '\t';
        else if (esc === 'r') str += '\r';
        else if (esc === '\\') str += '\\';
        else if (esc === '"') str += '"';
        else str += esc;
      } else {
        str += this.source[this.pos];
      }
      this.advance(1);
    }
    if (this.pos < this.source.length) this.advance(1);
    return { type: TokenType.STRING, value: str, line: startLine, col: startCol };
  }

  readChar(startLine, startCol) {
    this.advance(1);
    let ch = '';
    if (this.source[this.pos] === '\\') {
      this.advance(1);
      const esc = this.source[this.pos];
      if (esc === 'n') ch = '\n';
      else if (esc === 't') ch = '\t';
      else if (esc === '0') ch = '\0';
      else ch = esc;
    } else {
      ch = this.source[this.pos];
    }
    this.advance(1);
    if (this.pos < this.source.length && this.source[this.pos] === '\'') this.advance(1);
    return { type: TokenType.CHAR, value: ch, line: startLine, col: startCol };
  }
}

// --- Recursive Descent AST Parser ---
export class ArduinoParser {
  constructor(tokens, originalSource = '') {
    this.tokens = tokens;
    this.originalSource = originalSource;
    this.pos = 0;
  }

  peek(offset = 0) {
    const idx = this.pos + offset;
    return idx < this.tokens.length ? this.tokens[idx] : this.tokens[this.tokens.length - 1];
  }

  match(...expected) {
    const token = this.peek();
    for (const exp of expected) {
      if (typeof exp === 'string') {
        if (token.value === exp) {
          this.pos++;
          return token;
        }
      } else if (exp.type && token.type === exp.type) {
        if (!exp.value || token.value === exp.value) {
          this.pos++;
          return token;
        }
      }
    }
    return null;
  }

  expect(expectedValue) {
    const token = this.match(expectedValue);
    if (!token) {
      const cur = this.peek();
      throw this.buildError(`Expected '${expectedValue}' but found '${cur.value || 'EOF'}'`, cur);
    }
    return token;
  }

  buildError(msg, token) {
    const line = token.line || 1;
    const col = token.col || 1;
    const err = new Error(`Compilation error at line ${line}, col ${col}: ${msg}`);
    err.line = line;
    err.col = col;
    err.tokenValue = token.value;
    return err;
  }

  parse() {
    const program = { type: 'Program', body: [] };
    while (this.peek().type !== TokenType.EOF) {
      const decl = this.parseTopLevel();
      if (decl) program.body.push(decl);
    }
    return program;
  }

  parseTopLevel() {
    if (this.match(';')) return null;

    const typeTokens = this.parseType();
    if (!typeTokens) {
      const cur = this.peek();
      throw this.buildError(`Unexpected token '${cur.value}'. Expected type specifier or function declaration.`, cur);
    }

    const nameToken = this.expectIdentifier();

    // Check if function declaration vs variable constructor
    let isFunction = false;
    if (this.peek().value === '(') {
      if (['Servo', 'LiquidCrystal', 'LiquidCrystal_I2C', 'Adafruit_SSD1306', 'DHT'].includes(typeTokens.typeName)) {
        isFunction = false;
      } else {
        let depth = 0;
        let lookahead = this.pos;
        while (lookahead < this.tokens.length) {
          if (this.tokens[lookahead].value === '(') depth++;
          else if (this.tokens[lookahead].value === ')') {
            depth--;
            if (depth === 0) {
              const afterParen = this.tokens[lookahead + 1];
              if (afterParen && afterParen.value === '{') {
                isFunction = true;
              }
              break;
            }
          }
          lookahead++;
        }
      }
    }

    if (isFunction) {
      return this.parseFunctionDeclaration(typeTokens, nameToken);
    }

    return this.parseVariableDeclaration(typeTokens, nameToken);
  }

  parseType() {
    const validTypes = new Set([
      'void', 'int', 'long', 'short', 'float', 'double', 'char', 'bool', 'boolean', 'byte',
      'unsigned', 'signed', 'const', 'String', 'Servo', 'LiquidCrystal', 'LiquidCrystal_I2C', 'Adafruit_SSD1306', 'DHT',
      'uint8_t', 'uint16_t', 'uint32_t', 'int8_t', 'int16_t', 'int32_t', 'size_t', 'word'
    ]);

    let typeStr = '';
    let isConst = false;

    while (this.peek().type === TokenType.KEYWORD || this.peek().type === TokenType.IDENTIFIER) {
      const val = this.peek().value;
      if (val === 'const') {
        isConst = true;
        this.pos++;
      } else if (validTypes.has(val) || (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER)) {
        typeStr += (typeStr ? ' ' : '') + val;
        this.pos++;
      } else {
        break;
      }
    }

    return typeStr ? { typeName: typeStr, isConst } : null;
  }

  expectIdentifier() {
    const cur = this.peek();
    if (cur.type === TokenType.IDENTIFIER) {
      this.pos++;
      return cur;
    }
    throw this.buildError(`Expected variable or function name identifier, found '${cur.value}'`, cur);
  }

  parseFunctionDeclaration(typeInfo, nameToken) {
    this.expect('(');
    const params = [];
    while (this.peek().value !== ')' && this.peek().type !== TokenType.EOF) {
      const pType = this.parseType();
      const pName = this.expectIdentifier();
      params.push({ name: pName.value, type: pType ? pType.typeName : 'auto' });
      if (this.peek().value === ',') this.match(',');
    }
    this.expect(')');

    const body = this.parseBlock();
    return {
      type: 'FunctionDeclaration',
      name: nameToken.value,
      returnType: typeInfo.typeName,
      params,
      body,
      line: nameToken.line
    };
  }

  parseVariableDeclaration(typeInfo, nameToken) {
    const declarations = [];

    const parseSingleVar = (name) => {
      let isArray = false;
      let arraySize = null;
      if (this.match('[')) {
        isArray = true;
        if (this.peek().value !== ']') {
          arraySize = this.parseExpression();
        }
        this.expect(']');
      }

      let init = null;
      let constructorArgs = null;

      if (this.match('(')) {
        constructorArgs = [];
        while (this.peek().value !== ')' && this.peek().type !== TokenType.EOF) {
          constructorArgs.push(this.parseExpression());
          if (this.peek().value === ',') this.match(',');
        }
        this.expect(')');
      } else if (this.match('=')) {
        if (this.match('{')) {
          const elements = [];
          while (this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
            elements.push(this.parseExpression());
            if (this.peek().value === ',') this.match(',');
          }
          this.expect('}');
          init = { type: 'ArrayLiteral', elements };
        } else {
          init = this.parseExpression();
        }
      }

      return {
        type: 'VariableDeclarator',
        name,
        varType: typeInfo.typeName,
        isConst: typeInfo.isConst,
        isArray,
        arraySize,
        init,
        constructorArgs
      };
    };

    declarations.push(parseSingleVar(nameToken.value));

    while (this.match(',')) {
      const nextName = this.expectIdentifier();
      declarations.push(parseSingleVar(nextName.value));
    }

    this.match(';');
    return {
      type: 'VariableDeclaration',
      declarations,
      line: nameToken.line
    };
  }

  parseBlock() {
    this.expect('{');
    const statements = [];
    while (this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    this.expect('}');
    return { type: 'BlockStatement', body: statements };
  }

  parseStatement() {
    const token = this.peek();
    if (this.match(';')) return null;

    if (token.value === '{') return this.parseBlock();
    if (token.value === 'if') return this.parseIfStatement();
    if (token.value === 'while') return this.parseWhileStatement();
    if (token.value === 'do') return this.parseDoWhileStatement();
    if (token.value === 'for') return this.parseForStatement();
    if (token.value === 'switch') return this.parseSwitchStatement();
    if (token.value === 'return') return this.parseReturnStatement();

    if (token.value === 'break') {
      this.match('break');
      this.match(';');
      return { type: 'BreakStatement', line: token.line };
    }
    if (token.value === 'continue') {
      this.match('continue');
      this.match(';');
      return { type: 'ContinueStatement', line: token.line };
    }

    // Local Variable Declaration
    const savedPos = this.pos;
    const typeInfo = this.parseType();
    if (typeInfo && this.peek().type === TokenType.IDENTIFIER) {
      const name = this.expectIdentifier();
      if (this.peek().value !== '(' || ['Servo', 'LiquidCrystal', 'LiquidCrystal_I2C', 'Adafruit_SSD1306', 'DHT'].includes(typeInfo.typeName)) {
        return this.parseVariableDeclaration(typeInfo, name);
      }
    }
    this.pos = savedPos;

    // Expression Statement
    const expr = this.parseExpression();
    this.match(';');
    return { type: 'ExpressionStatement', expression: expr, line: token.line };
  }

  parseIfStatement() {
    const ifToken = this.expect('if');
    this.expect('(');
    const test = this.parseExpression();
    this.expect(')');
    const consequent = this.parseStatement();
    let alternate = null;
    if (this.match('else')) {
      alternate = this.parseStatement();
    }
    return { type: 'IfStatement', test, consequent, alternate, line: ifToken.line };
  }

  parseWhileStatement() {
    const whileToken = this.expect('while');
    this.expect('(');
    const test = this.parseExpression();
    this.expect(')');
    const body = this.parseStatement();
    return { type: 'WhileStatement', test, body, line: whileToken.line };
  }

  parseDoWhileStatement() {
    const doToken = this.expect('do');
    const body = this.parseStatement();
    this.expect('while');
    this.expect('(');
    const test = this.parseExpression();
    this.expect(')');
    this.match(';');
    return { type: 'DoWhileStatement', body, test, line: doToken.line };
  }

  parseForStatement() {
    const forToken = this.expect('for');
    this.expect('(');

    let init = null;
    if (this.peek().value !== ';') {
      const typeInfo = this.parseType();
      if (typeInfo) {
        const name = this.expectIdentifier();
        init = this.parseVariableDeclaration(typeInfo, name);
      } else {
        init = this.parseExpression();
        this.match(';');
      }
    } else {
      this.match(';');
    }

    let test = null;
    if (this.peek().value !== ';') {
      test = this.parseExpression();
    }
    this.expect(';');

    let update = null;
    if (this.peek().value !== ')') {
      update = this.parseExpression();
    }
    this.expect(')');

    const body = this.parseStatement();
    return { type: 'ForStatement', init, test, update, body, line: forToken.line };
  }

  parseSwitchStatement() {
    const swToken = this.expect('switch');
    this.expect('(');
    const discriminant = this.parseExpression();
    this.expect(')');
    this.expect('{');

    const cases = [];
    while (this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
      if (this.match('case')) {
        const test = this.parseExpression();
        this.expect(':');
        const consequent = [];
        while (this.peek().value !== 'case' && this.peek().value !== 'default' && this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
          const stmt = this.parseStatement();
          if (stmt) consequent.push(stmt);
        }
        cases.push({ test, consequent });
      } else if (this.match('default')) {
        this.expect(':');
        const consequent = [];
        while (this.peek().value !== 'case' && this.peek().value !== 'default' && this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
          const stmt = this.parseStatement();
          if (stmt) consequent.push(stmt);
        }
        cases.push({ test: null, consequent });
      } else {
        this.pos++;
      }
    }
    this.expect('}');
    return { type: 'SwitchStatement', discriminant, cases, line: swToken.line };
  }

  parseReturnStatement() {
    const retToken = this.expect('return');
    let argument = null;
    if (this.peek().value !== ';') {
      argument = this.parseExpression();
    }
    this.match(';');
    return { type: 'ReturnStatement', argument, line: retToken.line };
  }

  // --- Expressions & Operator Precedence ---
  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseTernary();
    const assignOps = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='];
    const cur = this.peek();

    if (assignOps.includes(cur.value)) {
      this.pos++;
      const right = this.parseAssignment();
      return { type: 'AssignmentExpression', operator: cur.value, left, right, line: cur.line };
    }

    return left;
  }

  parseTernary() {
    let expr = this.parseLogicalOr();
    if (this.match('?')) {
      const consequent = this.parseExpression();
      this.expect(':');
      const alternate = this.parseExpression();
      return { type: 'ConditionalExpression', test: expr, consequent, alternate };
    }
    return expr;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.match('||')) {
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryExpression', operator: '||', left, right };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseBitwiseOr();
    while (this.match('&&')) {
      const right = this.parseBitwiseOr();
      left = { type: 'BinaryExpression', operator: '&&', left, right };
    }
    return left;
  }

  parseBitwiseOr() {
    let left = this.parseBitwiseXor();
    while (this.match('|')) {
      const right = this.parseBitwiseXor();
      left = { type: 'BinaryExpression', operator: '|', left, right };
    }
    return left;
  }

  parseBitwiseXor() {
    let left = this.parseBitwiseAnd();
    while (this.match('^')) {
      const right = this.parseBitwiseAnd();
      left = { type: 'BinaryExpression', operator: '^', left, right };
    }
    return left;
  }

  parseBitwiseAnd() {
    let left = this.parseEquality();
    while (this.match('&')) {
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator: '&', left, right };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseRelational();
    while (['==', '!='].includes(this.peek().value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseRelational();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  parseRelational() {
    let left = this.parseShift();
    while (['<', '<=', '>', '>='].includes(this.peek().value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseShift();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  parseShift() {
    let left = this.parseAdditive();
    while (['<<', '>>'].includes(this.peek().value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseAdditive();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (['+', '-'].includes(this.peek().value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.peek().value)) {
      const op = this.tokens[this.pos++].value;
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  parseUnary() {
    const cur = this.peek();
    if (['!', '~', '-', '+', '++', '--', '&', '*'].includes(cur.value)) {
      this.pos++;
      const argument = this.parseUnary();
      return { type: 'UnaryExpression', operator: cur.value, argument, prefix: true };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    while (true) {
      if (['++', '--'].includes(this.peek().value)) {
        const op = this.tokens[this.pos++].value;
        expr = { type: 'UnaryExpression', operator: op, argument: expr, prefix: false };
      } else if (this.match('(')) {
        const args = [];
        while (this.peek().value !== ')' && this.peek().type !== TokenType.EOF) {
          args.push(this.parseExpression());
          if (this.peek().value === ',') this.match(',');
        }
        this.expect(')');
        expr = { type: 'CallExpression', callee: expr, arguments: args, line: expr.line || 1 };
      } else if (this.match('[')) {
        const index = this.parseExpression();
        this.expect(']');
        expr = { type: 'IndexExpression', object: expr, index };
      } else if (this.match('.')) {
        const prop = this.expectIdentifier();
        expr = { type: 'MemberExpression', object: expr, property: prop.value };
      } else {
        break;
      }
    }

    return expr;
  }

  parsePrimary() {
    const cur = this.peek();

    if (cur.type === TokenType.NUMBER) {
      this.pos++;
      return { type: 'Literal', value: cur.value, raw: cur.raw, line: cur.line };
    }

    if (cur.type === TokenType.STRING) {
      this.pos++;
      return { type: 'Literal', value: cur.value, line: cur.line };
    }

    if (cur.type === TokenType.CHAR) {
      this.pos++;
      return { type: 'Literal', value: cur.value.charCodeAt(0), line: cur.line };
    }

    if (cur.value === 'true') {
      this.pos++;
      return { type: 'Literal', value: true, line: cur.line };
    }

    if (cur.value === 'false') {
      this.pos++;
      return { type: 'Literal', value: false, line: cur.line };
    }

    if (cur.value === 'HIGH') {
      this.pos++;
      return { type: 'Literal', value: 1, line: cur.line };
    }

    if (cur.value === 'LOW') {
      this.pos++;
      return { type: 'Literal', value: 0, line: cur.line };
    }

    if (cur.value === 'INPUT') {
      this.pos++;
      return { type: 'Literal', value: 0, line: cur.line };
    }

    if (cur.value === 'OUTPUT') {
      this.pos++;
      return { type: 'Literal', value: 1, line: cur.line };
    }

    if (cur.value === 'INPUT_PULLUP') {
      this.pos++;
      return { type: 'Literal', value: 2, line: cur.line };
    }

    if (cur.value === 'INPUT_PULLDOWN') {
      this.pos++;
      return { type: 'Literal', value: 3, line: cur.line };
    }

    if (cur.value === 'LED_BUILTIN') {
      this.pos++;
      return { type: 'Literal', value: 13, line: cur.line };
    }

    // Analog pin constants A0 - A15
    if (/^A(1[0-5]|[0-9])$/.test(cur.value)) {
      this.pos++;
      const pinIndex = parseInt(cur.value.substring(1), 10);
      return { type: 'Literal', value: 14 + pinIndex, line: cur.line };
    }

    if (cur.type === TokenType.IDENTIFIER) {
      this.pos++;
      return { type: 'Identifier', name: cur.value, line: cur.line };
    }

    if (this.match('(')) {
      const typeInfo = this.parseType();
      if (typeInfo && this.match(')')) {
        const argument = this.parseUnary();
        return { type: 'TypeCastExpression', targetType: typeInfo.typeName, argument };
      }
      const expr = this.parseExpression();
      this.expect(')');
      return expr;
    }

    throw this.buildError(`Unexpected token '${cur.value}'`, cur);
  }
}

// --- Environment Scope ---
export class Scope {
  constructor(parent = null) {
    this.parent = parent;
    this.variables = new Map();
  }

  declare(name, value) {
    this.variables.set(name, value);
    return value;
  }

  lookup(name) {
    if (this.variables.has(name)) return this.variables.get(name);
    if (this.parent) return this.parent.lookup(name);
    return undefined;
  }

  assign(name, value) {
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return true;
    }
    if (this.parent) {
      return this.parent.assign(name, value);
    }
    return false;
  }

  has(name) {
    if (this.variables.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
}

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

// --- Peripheral Emulations ---
export class SerialPeripheral {
  constructor(onOutputCallback) {
    this.onOutput = onOutputCallback;
    this.rxBuffer = [];
    this.baudRate = 9600;
    this.isOpen = false;
  }

  begin(baud) {
    this.baudRate = baud || 9600;
    this.isOpen = true;
  }

  _formatValue(val, format) {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') {
      if (format === 16 || format === 'HEX') return Math.trunc(val).toString(16).toUpperCase();
      if (format === 2 || format === 'BIN') return (val >>> 0).toString(2);
      if (format === 8 || format === 'OCT') return Math.trunc(val).toString(8);
      if (format === 10 || format === 'DEC') return Math.trunc(val).toString(10);
      if (typeof format === 'number' && Number.isInteger(format) && format >= 0) {
        return val.toFixed(format);
      }
    }
    return String(val);
  }

  print(val, format) {
    const text = this._formatValue(val, format);
    if (this.onOutput) this.onOutput(text, false);
  }

  println(val, format) {
    const text = this._formatValue(val, format);
    if (this.onOutput) this.onOutput(text, true);
  }

  write(val) {
    const text = typeof val === 'number' ? String.fromCharCode(val) : String(val);
    if (this.onOutput) this.onOutput(text, false);
  }

  available() {
    return this.rxBuffer.length;
  }

  availableForWrite() {
    return 64;
  }

  peek() {
    return this.rxBuffer.length > 0 ? this.rxBuffer[0] : -1;
  }

  read() {
    return this.rxBuffer.length > 0 ? this.rxBuffer.shift() : -1;
  }

  readBytes(buffer, length) {
    let count = 0;
    while (this.rxBuffer.length > 0 && count < length) {
      if (Array.isArray(buffer)) {
        buffer[count] = this.rxBuffer.shift();
      } else {
        this.rxBuffer.shift();
      }
      count++;
    }
    return count;
  }

  readString() {
    let str = '';
    while (this.rxBuffer.length > 0) {
      str += String.fromCharCode(this.rxBuffer.shift());
    }
    return str;
  }

  readStringUntil(terminator) {
    const termCode = typeof terminator === 'string' ? terminator.charCodeAt(0) : terminator;
    let str = '';
    while (this.rxBuffer.length > 0) {
      const c = this.rxBuffer.shift();
      if (c === termCode) break;
      str += String.fromCharCode(c);
    }
    return str;
  }

  parseInt() {
    let str = '';
    while (this.rxBuffer.length > 0) {
      const c = String.fromCharCode(this.rxBuffer[0]);
      if (/[0-9\-]/.test(c)) {
        str += String.fromCharCode(this.rxBuffer.shift());
      } else {
        break;
      }
    }
    return str ? parseInt(str, 10) : 0;
  }

  parseFloat() {
    let str = '';
    let hasDot = false;
    while (this.rxBuffer.length > 0) {
      const c = String.fromCharCode(this.rxBuffer[0]);
      if (/[0-9\-]/.test(c) || (c === '.' && !hasDot)) {
        if (c === '.') hasDot = true;
        str += String.fromCharCode(this.rxBuffer.shift());
      } else {
        break;
      }
    }
    return str ? parseFloat(str) : 0.0;
  }

  flush() {
    this.rxBuffer = [];
  }

  pushInput(str) {
    for (let i = 0; i < str.length; i++) {
      this.rxBuffer.push(str.charCodeAt(i));
    }
  }
}

export class ServoPeripheral {
  constructor(board) {
    this.board = board;
    this.pin = null;
    this.angle = 90;
    this.isAttached = false;
  }

  attach(pin) {
    this.pin = this.board.resolvePinIndex(pin);
    this.isAttached = true;
    this.board.setPinMode(this.pin, PinMode.OUTPUT);
    this.board.notify('servoAttached', { pin: this.pin, angle: this.angle });
  }

  write(angle) {
    this.angle = Math.max(0, Math.min(180, Math.round(Number(angle) || 0)));
    if (this.isAttached && this.pin !== null) {
      const pwm = Math.round((this.angle / 180) * 255);
      this.board.analogWrite(this.pin, pwm);
      this.board.notify('servoAngle', { pin: this.pin, angle: this.angle });
    }
  }

  read() {
    return this.angle;
  }

  attached() {
    return this.isAttached;
  }

  detach() {
    this.isAttached = false;
    this.pin = null;
  }
}

export class LiquidCrystalPeripheral {
  constructor(board, rs, en, d4, d5, d6, d7) {
    this.board = board;
    this.pins = { rs, en, d4, d5, d6, d7 };
    this.cols = 16;
    this.rows = 2;
    this.cursorCol = 0;
    this.cursorRow = 0;
    this.buffer = [];
    this.clear();
  }

  begin(cols, rows) {
    this.cols = cols || 16;
    this.rows = rows || 2;
    this.clear();
  }

  init() {
    this.clear();
  }

  backlight() {}
  noBacklight() {}
  createChar(location, charmap) {}
  autoscroll() {}
  noAutoscroll() {}
  blink() {}
  noBlink() {}
  cursor() {}
  noCursor() {}
  display() {}
  noDisplay() {}
  scrollDisplayLeft() {}
  scrollDisplayRight() {}

  clear() {
    this.buffer = [];
    for (let r = 0; r < this.rows; r++) {
      this.buffer.push(new Array(this.cols).fill(' '));
    }
    this.cursorCol = 0;
    this.cursorRow = 0;
    this.notify();
  }

  home() {
    this.cursorCol = 0;
    this.cursorRow = 0;
  }

  setCursor(col, row) {
    this.cursorCol = Math.max(0, Math.min(this.cols - 1, Number(col) || 0));
    this.cursorRow = Math.max(0, Math.min(this.rows - 1, Number(row) || 0));
  }

  print(val) {
    const text = String(val);
    for (let i = 0; i < text.length; i++) {
      if (this.cursorCol < this.cols && this.cursorRow < this.rows) {
        this.buffer[this.cursorRow][this.cursorCol] = text[i];
        this.cursorCol++;
      }
    }
    this.notify();
  }

  write(charVal) {
    const ch = typeof charVal === 'number' ? String.fromCharCode(charVal) : String(charVal);
    this.print(ch);
  }

  get lines() {
    return this.buffer.map(row => row.join(''));
  }

  notify() {
    if (this.board) {
      this.board.notify('lcdUpdate', {
        cols: this.cols,
        rows: this.rows,
        lines: this.lines
      });
    }
  }
}

export class OledPeripheral {
  constructor(board) {
    this.board = board;
    this.width = 128;
    this.height = 64;
    this.textLines = [];
    this.cursorX = 0;
    this.cursorY = 0;
    this.textSize = 1;
  }

  begin() {
    this.clearDisplay();
  }

  clearDisplay() {
    this.textLines = [];
    this.notify();
  }

  get lines() {
    return this.textLines;
  }

  setTextSize(sz) {
    this.textSize = sz || 1;
  }

  setTextColor() {}

  setCursor(x, y) {
    this.cursorX = x;
    this.cursorY = y;
  }

  print(val) {
    this.textLines.push(String(val));
  }

  println(val) {
    this.textLines.push(String(val));
    this.notify();
  }

  display() {
    this.notify();
  }

  drawPixel(x, y, color) {}
  drawLine(x0, y0, x1, y1, color) {}
  drawRect(x, y, w, h, color) {}
  fillRect(x, y, w, h, color) {}
  drawCircle(x, y, r, color) {}
  fillCircle(x, y, r, color) {}
  invertDisplay(i) {}
  dim(dim) {}
  cp437(b) {}
  write(ch) {
    const text = typeof ch === 'number' ? String.fromCharCode(ch) : String(ch);
    this.print(text);
  }

  notify() {
    if (this.board) {
      this.board.notify('oledUpdate', {
        lines: this.textLines.slice(-6)
      });
    }
  }
}

export class DhtPeripheral {
  constructor(board, pin, type) {
    this.board = board;
    this.pin = pin;
    this.type = type || 11;
    this.temperature = 24.0;
    this.humidity = 50.0;
  }

  begin() {}

  readTemperature(isFahrenheit = false) {
    return isFahrenheit ? (this.temperature * 1.8 + 32) : this.temperature;
  }

  readHumidity() {
    return this.humidity;
  }

  computeHeatIndex(temp, percentHumidity, isFahrenheit = false) {
    const t = isFahrenheit ? temp : (temp * 1.8 + 32);
    const rh = percentHumidity !== undefined ? percentHumidity : this.humidity;
    const hi = 0.5 * (t + 61.0 + ((t - 68.0) * 1.2) + (rh * 0.094));
    return isFahrenheit ? hi : ((hi - 32) * 5 / 9);
  }
}

export class EepromPeripheral {
  constructor(size = 1024) {
    this.size = size;
    this.data = new Uint8Array(size).fill(0xff);
  }

  read(address) {
    const addr = Math.max(0, Math.min(this.size - 1, Number(address) || 0));
    return this.data[addr];
  }

  write(address, value) {
    const addr = Math.max(0, Math.min(this.size - 1, Number(address) || 0));
    this.data[addr] = (Number(value) || 0) & 0xff;
  }

  update(address, value) {
    const addr = Math.max(0, Math.min(this.size - 1, Number(address) || 0));
    const byteVal = (Number(value) || 0) & 0xff;
    if (this.data[addr] !== byteVal) {
      this.data[addr] = byteVal;
    }
  }

  length() {
    return this.size;
  }

  get(address, val) {
    return this.read(address);
  }

  put(address, val) {
    this.write(address, val);
    return val;
  }
}

export class WirePeripheral {
  constructor(board) {
    this.board = board;
    this.txBuffer = [];
    this.rxBuffer = [];
    this.txAddress = 0;
  }

  begin(address) {
    this.address = address;
  }

  beginTransmission(address) {
    this.txAddress = address;
    this.txBuffer = [];
  }

  write(data) {
    if (typeof data === 'string') {
      for (let i = 0; i < data.length; i++) {
        this.txBuffer.push(data.charCodeAt(i));
      }
      return data.length;
    }
    this.txBuffer.push((Number(data) || 0) & 0xff);
    return 1;
  }

  endTransmission(stop = true) {
    if (this.board) {
      this.board.notify('i2cTransmission', { address: this.txAddress, data: [...this.txBuffer], stop });
    }
    this.txBuffer = [];
    return 0; // 0 = success in Wire library
  }

  requestFrom(address, quantity, stop = true) {
    this.rxBuffer = new Array(quantity).fill(0);
    return quantity;
  }

  available() {
    return this.rxBuffer.length;
  }

  read() {
    return this.rxBuffer.length > 0 ? this.rxBuffer.shift() : -1;
  }

  onReceive(fn) {}
  onRequest(fn) {}
}

export class SpiPeripheral {
  constructor(board) {
    this.board = board;
  }

  begin() {}
  end() {}
  setBitOrder(order) {}
  setClockDivider(divider) {}
  setDataMode(mode) {}
  transfer(val) {
    return (Number(val) || 0) & 0xff;
  }
}

// --- Cooperative Virtual Machine / Interpreter ---
export class ArduinoInterpreter {
  constructor(board) {
    this.board = board;
    this.globalScope = new Scope();
    this.functions = new Map();
    this.status = 'STOPPED'; // STOPPED, RUNNING, PAUSED, ERROR
    this.simTimeMs = 0;
    this.delayWakeTime = 0;
    this.currentGenerator = null;
    this.activeRoutine = null;
    this.currentLine = 1;
    this.instructionCount = 0;
    this.maxInstructionsPerStep = 25000;
    this.onSerialOutput = null;
    this.onError = null;
    this.onStatusChange = null;
    this.onStep = null;
    this.pulseInSensors = new Map();

    this.serial = new SerialPeripheral((text, newline) => {
      if (this.onSerialOutput) this.onSerialOutput(text, newline);
    });
    this.eeprom = new EepromPeripheral(1024);
    this.wire = new WirePeripheral(board);
    this.spi = new SpiPeripheral(board);

    this.initBuiltins();
  }

  get environment() {
    return this.globalScope;
  }

  initBuiltins() {
    this.globalScope = new Scope();
    this.functions.clear();

    this.globalScope.declare('HIGH', 1);
    this.globalScope.declare('LOW', 0);
    this.globalScope.declare('INPUT', 0);
    this.globalScope.declare('OUTPUT', 1);
    this.globalScope.declare('INPUT_PULLUP', 2);
    this.globalScope.declare('INPUT_PULLDOWN', 3);
    this.globalScope.declare('LED_BUILTIN', 13);
    this.globalScope.declare('PI', Math.PI);
    this.globalScope.declare('HALF_PI', Math.PI / 2);
    this.globalScope.declare('TWO_PI', Math.PI * 2);
    this.globalScope.declare('DEG_TO_RAD', Math.PI / 180.0);
    this.globalScope.declare('RAD_TO_DEG', 180.0 / Math.PI);

    // Number formats and interrupt modes
    this.globalScope.declare('DEC', 10);
    this.globalScope.declare('HEX', 16);
    this.globalScope.declare('OCT', 8);
    this.globalScope.declare('BIN', 2);
    this.globalScope.declare('CHANGE', 1);
    this.globalScope.declare('FALLING', 2);
    this.globalScope.declare('RISING', 3);
    this.globalScope.declare('DEFAULT', 1);
    this.globalScope.declare('INTERNAL', 3);
    this.globalScope.declare('INTERNAL1V1', 2);
    this.globalScope.declare('INTERNAL2V56', 3);
    this.globalScope.declare('EXTERNAL', 0);
    this.globalScope.declare('SSD1306_SWITCHCAPVCC', 2);
    this.globalScope.declare('WHITE', 1);
    this.globalScope.declare('BLACK', 0);
    this.globalScope.declare('INVERSE', 2);

    // Analog pins A0-A15
    for (let i = 0; i <= 15; i++) {
      this.globalScope.declare(`A${i}`, 14 + i);
    }

    this.globalScope.declare('DHT11', 11);
    this.globalScope.declare('DHT22', 22);

    this.globalScope.declare('Serial', this.serial);
    this.globalScope.declare('Wire', this.wire);
    this.globalScope.declare('SPI', this.spi);
    this.globalScope.declare('EEPROM', this.eeprom);

    this.builtins = {
      pinMode: (pin, mode) => this.board.setPinMode(pin, mode),
      digitalWrite: (pin, val) => this.board.digitalWrite(pin, val),
      digitalRead: (pin) => this.board.digitalRead(pin),
      analogWrite: (pin, duty) => this.board.analogWrite(pin, duty),
      analogRead: (pin) => this.board.analogRead(pin),
      analogReference: (type) => this.board.setAnalogReference(type),
      millis: () => Math.round(this.simTimeMs),
      micros: () => Math.round(this.simTimeMs * 1000),
      map: (val, inMin, inMax, outMin, outMax) => {
        return Math.round((val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
      },
      constrain: (amt, low, high) => Math.max(low, Math.min(high, amt)),
      min: (a, b) => Math.min(a, b),
      max: (a, b) => Math.max(a, b),
      abs: (x) => Math.abs(x),
      sq: (x) => x * x,
      sqrt: (x) => Math.sqrt(x),
      pow: (b, e) => Math.pow(b, e),
      sin: (rad) => Math.sin(rad),
      cos: (rad) => Math.cos(rad),
      tan: (rad) => Math.tan(rad),
      round: (x) => Math.round(x),
      radians: (deg) => (deg * Math.PI) / 180.0,
      degrees: (rad) => (rad * 180.0) / Math.PI,
      random: (min, max) => {
        if (max === undefined) {
          max = min;
          min = 0;
        }
        return Math.floor(Math.random() * (max - min)) + min;
      },
      randomSeed: () => {},
      tone: (pin, freq, duration) => {
        this.board.notify('tone', { pin, freq, duration });
      },
      noTone: (pin) => {
        this.board.notify('noTone', { pin });
      },
      pulseIn: (pin, val, timeout) => {
        const p = this.board.resolvePinIndex(pin);
        if (this.pulseInSensors.has(p)) {
          return this.pulseInSensors.get(p)();
        }
        return 580; // realistic default ~10cm
      },
      bitRead: (value, bit) => (value >> bit) & 0x01,
      bitSet: (value, bit) => value | (1 << bit),
      bitClear: (value, bit) => value & ~(1 << bit),
      bitWrite: (value, bit, bitvalue) => bitvalue ? (value | (1 << bit)) : (value & ~(1 << bit)),
      bit: (b) => 1 << b,
      lowByte: (w) => w & 0xff,
      highByte: (w) => (w >> 8) & 0xff,
      word: (h, l) => l !== undefined ? (((Number(h) || 0) & 0xff) << 8) | ((Number(l) || 0) & 0xff) : ((Number(h) || 0) & 0xffff),
      isAlphaNumeric: (c) => typeof c === 'string' ? /^[a-zA-Z0-9]$/.test(c) : /^[a-zA-Z0-9]$/.test(String.fromCharCode(c)),
      isAlpha: (c) => typeof c === 'string' ? /^[a-zA-Z]$/.test(c) : /^[a-zA-Z]$/.test(String.fromCharCode(c)),
      isAscii: (c) => typeof c === 'string' ? c.charCodeAt(0) <= 127 : c <= 127,
      isWhitespace: (c) => typeof c === 'string' ? /^\s$/.test(c) : /^\s$/.test(String.fromCharCode(c)),
      isControl: (c) => typeof c === 'string' ? c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 : c < 32 || c === 127,
      isDigit: (c) => typeof c === 'string' ? /^[0-9]$/.test(c) : /^[0-9]$/.test(String.fromCharCode(c)),
      isGraph: (c) => typeof c === 'string' ? c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127 : c > 32 && c < 127,
      isLowerCase: (c) => typeof c === 'string' ? /^[a-z]$/.test(c) : /^[a-z]$/.test(String.fromCharCode(c)),
      isPrintable: (c) => typeof c === 'string' ? c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127 : c >= 32 && c < 127,
      isPunct: (c) => typeof c === 'string' ? /^[!-/:-@[-`{-~]$/.test(c) : /^[!-/:-@[-`{-~]$/.test(String.fromCharCode(c)),
      isSpace: (c) => typeof c === 'string' ? /^[ \t\r\n\v\f]$/.test(c) : /^[ \t\r\n\v\f]$/.test(String.fromCharCode(c)),
      isUpperCase: (c) => typeof c === 'string' ? /^[A-Z]$/.test(c) : /^[A-Z]$/.test(String.fromCharCode(c)),
      isHexadecimalDigit: (c) => typeof c === 'string' ? /^[0-9a-fA-F]$/.test(c) : /^[0-9a-fA-F]$/.test(String.fromCharCode(c)),
      int: (val) => Math.trunc(Number(val) || 0),
      float: (val) => Number(val) || 0,
      double: (val) => Number(val) || 0,
      char: (val) => typeof val === 'string' ? val.charAt(0) : String.fromCharCode(Number(val) || 0),
      byte: (val) => (Number(val) || 0) & 0xff,
      boolean: (val) => Boolean(val) ? 1 : 0,
      bool: (val) => Boolean(val) ? 1 : 0,
      String: (val, base) => {
        if (val === undefined || val === null) return '';
        if (typeof val === 'number' && base) {
          if (base === 16 || base === 'HEX') return Math.trunc(val).toString(16).toUpperCase();
          if (base === 2 || base === 'BIN') return (val >>> 0).toString(2);
          if (base === 8 || base === 'OCT') return Math.trunc(val).toString(8);
          if (base === 10 || base === 'DEC') return Math.trunc(val).toString(10);
          return val.toFixed(base);
        }
        return String(val);
      }
    };
  }

  registerPulseSensor(pin, providerFn) {
    this.pulseInSensors.set(this.board.resolvePinIndex(pin), providerFn);
  }

  compile(code) {
    try {
      const tokenizer = new ArduinoTokenizer(code);
      const tokens = tokenizer.tokenize();
      const parser = new ArduinoParser(tokens, code);
      this.ast = parser.parse();
      return { success: true, ast: this.ast };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        line: err.line || 1,
        col: err.col || 1
      };
    }
  }

  loadSketch(code) {
    const result = this.compile(code);
    if (!result.success) {
      this.setStatus('ERROR');
      if (this.onError) this.onError(result);
      return result;
    }

    this.initBuiltins();

    for (const node of this.ast.body) {
      if (node.type === 'FunctionDeclaration') {
        this.functions.set(node.name, node);
      } else if (node.type === 'VariableDeclaration') {
        this.initVariableDeclaration(node, this.globalScope);
      }
    }

    if (!this.functions.has('setup') && !this.functions.has('loop')) {
      const err = { message: 'Sketch must contain setup() or loop() function.', line: 1, col: 1 };
      this.setStatus('ERROR');
      if (this.onError) this.onError(err);
      return { success: false, error: err.message };
    }

    this.simTimeMs = 0;
    this.delayWakeTime = 0;
    this.activeRoutine = 'setup';
    const setupFn = this.functions.get('setup');
    this.currentGenerator = setupFn ? this.executeFunction(setupFn, [], this.globalScope) : null;
    this.setStatus('IDLE');
    return { success: true };
  }

  initVariableDeclaration(node, scope) {
    for (const decl of node.declarations) {
      let val = 0;
      if (decl.varType === 'Servo') {
        val = new ServoPeripheral(this.board);
      } else if (decl.varType === 'LiquidCrystal' || decl.varType === 'LiquidCrystal_I2C') {
        const args = (decl.constructorArgs || []).map(a => this.evaluateExpressionSync(a, scope));
        val = new LiquidCrystalPeripheral(this.board, ...args);
      } else if (decl.varType === 'Adafruit_SSD1306') {
        val = new OledPeripheral(this.board);
      } else if (decl.varType === 'DHT') {
        val = new DhtPeripheral(this.board);
      } else if (decl.init) {
        val = this.evaluateExpressionSync(decl.init, scope);
      } else if (decl.varType === 'String' || decl.varType === 'string') {
        val = decl.constructorArgs && decl.constructorArgs.length > 0 ?
          String(this.evaluateExpressionSync(decl.constructorArgs[0], scope)) : '';
      } else if (decl.isArray) {
        const sz = decl.arraySize ? this.evaluateExpressionSync(decl.arraySize, scope) : 10;
        val = new Array(sz).fill(0);
      }
      scope.declare(decl.name, val);
    }
  }

  start() {
    this.setStatus('RUNNING');
  }

  pause() {
    this.setStatus('PAUSED');
  }

  stop() {
    this.setStatus('STOPPED');
    this.board.reset();
  }

  setStatus(status) {
    this.status = status;
    if (this.onStatusChange) this.onStatusChange(status);
  }

  step(deltaMs = 10) {
    if (this.status !== 'RUNNING') return;

    this.simTimeMs += deltaMs;

    if (this.simTimeMs < this.delayWakeTime) {
      return;
    }

    this.instructionCount = 0;

    while (this.instructionCount < this.maxInstructionsPerStep) {
      this.instructionCount++;

      if (this.currentGenerator) {
        try {
          const res = this.currentGenerator.next();
          if (res.done) {
            this.currentGenerator = null;
            return;
          } else if (res.value && res.value.type === 'DELAY') {
            this.delayWakeTime = this.simTimeMs + res.value.duration;
            return;
          }
        } catch (err) {
          this.setStatus('ERROR');
          const errObj = { message: err.message || String(err), line: this.currentLine };
          if (this.onError) this.onError(errObj);
          return;
        }
      } else {
        const loopFn = this.functions.get('loop');
        if (loopFn) {
          this.activeRoutine = 'loop';
          this.currentGenerator = this.executeFunction(loopFn, [], this.globalScope);
        } else {
          this.setStatus('STOPPED');
          return;
        }
      }
    }

    // Safety limit reached
    this.setStatus('PAUSED');
    if (this.onError) {
      this.onError({
        message: 'Simulation Safety Limit Reached: Sketch ran too many instructions without delay(). Execution paused safely.',
        line: this.currentLine
      });
    }
  }

  sendSerialInput(text) {
    this.serial.pushInput(text);
  }

  *executeFunction(funcNode, args, parentScope) {
    const scope = new Scope(parentScope);
    for (let i = 0; i < funcNode.params.length; i++) {
      scope.declare(funcNode.params[i].name, args[i] !== undefined ? args[i] : 0);
    }

    this.currentLine = funcNode.line || this.currentLine;
    if (this.onStep) this.onStep({ routine: funcNode.name, line: this.currentLine });

    const res = yield* this.executeStatement(funcNode.body, scope);
    if (res instanceof ReturnSignal) {
      return res.value;
    }
    return undefined;
  }

  *executeStatement(node, scope) {
    if (!node) return;

    if (node.line) {
      this.currentLine = node.line;
      if (this.onStep) this.onStep({ routine: this.activeRoutine, line: node.line });
    }

    switch (node.type) {
      case 'BlockStatement': {
        const blockScope = new Scope(scope);
        for (const stmt of node.body) {
          const sig = yield* this.executeStatement(stmt, blockScope);
          if (sig instanceof ReturnSignal || sig instanceof BreakSignal || sig instanceof ContinueSignal) {
            return sig;
          }
        }
        break;
      }

      case 'VariableDeclaration': {
        for (const decl of node.declarations) {
          let val = 0;
          if (decl.varType === 'Servo') {
            val = new ServoPeripheral(this.board);
          } else if (decl.varType === 'LiquidCrystal' || decl.varType === 'LiquidCrystal_I2C') {
            const args = [];
            for (const a of (decl.constructorArgs || [])) {
              args.push(yield* this.evaluateExpression(a, scope));
            }
            val = new LiquidCrystalPeripheral(this.board, ...args);
          } else if (decl.varType === 'Adafruit_SSD1306') {
            val = new OledPeripheral(this.board);
          } else if (decl.varType === 'DHT') {
            val = new DhtPeripheral(this.board);
          } else if (decl.init) {
            val = yield* this.evaluateExpression(decl.init, scope);
          } else if (decl.varType === 'String' || decl.varType === 'string') {
            val = decl.constructorArgs && decl.constructorArgs.length > 0 ?
              String(yield* this.evaluateExpression(decl.constructorArgs[0], scope)) : '';
          } else if (decl.isArray) {
            const sz = decl.arraySize ? (yield* this.evaluateExpression(decl.arraySize, scope)) : 10;
            val = new Array(sz).fill(0);
          }
          scope.declare(decl.name, val);
        }
        break;
      }

      case 'ExpressionStatement': {
        yield* this.evaluateExpression(node.expression, scope);
        break;
      }

      case 'IfStatement': {
        const condition = yield* this.evaluateExpression(node.test, scope);
        if (Boolean(condition)) {
          const sig = yield* this.executeStatement(node.consequent, scope);
          if (sig) return sig;
        } else if (node.alternate) {
          const sig = yield* this.executeStatement(node.alternate, scope);
          if (sig) return sig;
        }
        break;
      }

      case 'WhileStatement': {
        while (Boolean(yield* this.evaluateExpression(node.test, scope))) {
          const sig = yield* this.executeStatement(node.body, scope);
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;
        }
        break;
      }

      case 'DoWhileStatement': {
        do {
          const sig = yield* this.executeStatement(node.body, scope);
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;
        } while (Boolean(yield* this.evaluateExpression(node.test, scope)));
        break;
      }

      case 'ForStatement': {
        const forScope = new Scope(scope);
        if (node.init) {
          if (node.init.type === 'VariableDeclaration') {
            yield* this.executeStatement(node.init, forScope);
          } else {
            yield* this.evaluateExpression(node.init, forScope);
          }
        }

        while (!node.test || Boolean(yield* this.evaluateExpression(node.test, forScope))) {
          const sig = yield* this.executeStatement(node.body, forScope);
          if (sig instanceof ReturnSignal) return sig;
          if (sig instanceof BreakSignal) break;

          if (node.update) {
            yield* this.evaluateExpression(node.update, forScope);
          }
        }
        break;
      }

      case 'SwitchStatement': {
        const disc = yield* this.evaluateExpression(node.discriminant, scope);
        let matched = false;
        for (const c of node.cases) {
          if (!matched && c.test !== null) {
            const caseVal = yield* this.evaluateExpression(c.test, scope);
            if (caseVal === disc) matched = true;
          } else if (c.test === null) {
            matched = true;
          }

          if (matched) {
            let breakOut = false;
            for (const stmt of c.consequent) {
              const sig = yield* this.executeStatement(stmt, scope);
              if (sig instanceof ReturnSignal) return sig;
              if (sig instanceof BreakSignal) {
                breakOut = true;
                break;
              }
            }
            if (breakOut) break;
          }
        }
        break;
      }

      case 'ReturnStatement': {
        const val = node.argument ? (yield* this.evaluateExpression(node.argument, scope)) : undefined;
        return new ReturnSignal(val);
      }

      case 'BreakStatement':
        return new BreakSignal();

      case 'ContinueStatement':
        return new ContinueSignal();
    }
  }

  *evaluateExpression(node, scope) {
    if (!node) return 0;

    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'ArrayLiteral': {
        const arr = [];
        for (const el of node.elements) {
          arr.push(yield* this.evaluateExpression(el, scope));
        }
        return arr;
      }

      case 'Identifier': {
        if (scope.has(node.name)) {
          return scope.lookup(node.name);
        }
        if (this.builtins[node.name]) {
          return this.builtins[node.name];
        }
        throw new Error(`Variable or symbol '${node.name}' is not declared in current scope`);
      }

      case 'UnaryExpression': {
        if (node.operator === '++' || node.operator === '--') {
          const argName = node.argument.name;
          const current = scope.lookup(argName) || 0;
          const delta = (node.operator === '++') ? 1 : -1;
          const next = current + delta;
          scope.assign(argName, next);
          return node.prefix ? next : current;
        }

        const val = yield* this.evaluateExpression(node.argument, scope);
        switch (node.operator) {
          case '!': return !val ? 1 : 0;
          case '-': return -val;
          case '+': return +val;
          case '~': return ~val;
          case '&': return node.argument.name || val;
          case '*': return val;
          default: return val;
        }
      }

      case 'BinaryExpression': {
        const left = yield* this.evaluateExpression(node.left, scope);
        const right = yield* this.evaluateExpression(node.right, scope);

        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right === 0 ? 0 : left / right;
          case '%': return right === 0 ? 0 : left % right;
          case '==': return left == right ? 1 : 0;
          case '!=': return left != right ? 1 : 0;
          case '<': return left < right ? 1 : 0;
          case '<=': return left <= right ? 1 : 0;
          case '>': return left > right ? 1 : 0;
          case '>=': return left >= right ? 1 : 0;
          case '&&': return (Boolean(left) && Boolean(right)) ? 1 : 0;
          case '||': return (Boolean(left) || Boolean(right)) ? 1 : 0;
          case '&': return left & right;
          case '|': return left | right;
          case '^': return left ^ right;
          case '<<': return left << right;
          case '>>': return left >> right;
          default: return 0;
        }
      }

      case 'AssignmentExpression': {
        const right = yield* this.evaluateExpression(node.right, scope);

        if (node.left.type === 'Identifier') {
          const varName = node.left.name;
          let current = scope.has(varName) ? scope.lookup(varName) : 0;
          let updated = right;

          switch (node.operator) {
            case '=': updated = right; break;
            case '+=': updated = current + right; break;
            case '-=': updated = current - right; break;
            case '*=': updated = current * right; break;
            case '/=': updated = right === 0 ? 0 : current / right; break;
            case '%=': updated = current % right; break;
            case '&=': updated = current & right; break;
            case '|=': updated = current | right; break;
            case '^=': updated = current ^ right; break;
          }

          if (!scope.assign(varName, updated)) {
            scope.declare(varName, updated);
          }
          return updated;
        }

        if (node.left.type === 'IndexExpression') {
          const target = yield* this.evaluateExpression(node.left.object, scope);
          const index = yield* this.evaluateExpression(node.left.index, scope);
          if (Array.isArray(target)) {
            target[index] = right;
          }
          return right;
        }

        throw new Error('Invalid lvalue in assignment');
      }

      case 'ConditionalExpression': {
        const test = yield* this.evaluateExpression(node.test, scope);
        return Boolean(test) ? (yield* this.evaluateExpression(node.consequent, scope)) : (yield* this.evaluateExpression(node.alternate, scope));
      }

      case 'IndexExpression': {
        const target = yield* this.evaluateExpression(node.object, scope);
        const index = yield* this.evaluateExpression(node.index, scope);
        if (target && target[index] !== undefined) {
          return target[index];
        }
        return 0;
      }

      case 'MemberExpression': {
        const target = yield* this.evaluateExpression(node.object, scope);
        if (typeof target === 'string') {
          if (node.property === 'length') return target.length;
        }
        if (target && target[node.property] !== undefined) {
          return target[node.property];
        }
        return undefined;
      }

      case 'CallExpression': {
        if (node.callee.type === 'Identifier' && node.callee.name === 'delay') {
          const ms = yield* this.evaluateExpression(node.arguments[0], scope);
          yield { type: 'DELAY', duration: Math.max(0, Number(ms) || 0) };
          return;
        }

        if (node.callee.type === 'Identifier' && node.callee.name === 'delayMicroseconds') {
          const us = yield* this.evaluateExpression(node.arguments[0], scope);
          yield { type: 'DELAY', duration: Math.max(0, (Number(us) || 0) / 1000) };
          return;
        }

        if (node.callee.type === 'MemberExpression') {
          const targetObj = yield* this.evaluateExpression(node.callee.object, scope);
          const methodName = node.callee.property;

          // SPECIAL HANDLING: String member methods in Arduino C++
          if (typeof targetObj === 'string') {
            const args = [];
            for (const argNode of node.arguments) {
              args.push(yield* this.evaluateExpression(argNode, scope));
            }

            switch (methodName) {
              case 'length':
                return targetObj.length;
              case 'charAt':
                return targetObj.charAt(args[0] || 0);
              case 'substring':
                return args.length > 1 ? targetObj.substring(args[0], args[1]) : targetObj.substring(args[0]);
              case 'indexOf':
                return targetObj.indexOf(args[0], args[1]);
              case 'lastIndexOf':
                return targetObj.lastIndexOf(args[0], args[1]);
              case 'startsWith':
                return targetObj.startsWith(args[0]) ? 1 : 0;
              case 'endsWith':
                return targetObj.endsWith(args[0]) ? 1 : 0;
              case 'equals':
                return targetObj === String(args[0]) ? 1 : 0;
              case 'equalsIgnoreCase':
                return targetObj.toLowerCase() === String(args[0]).toLowerCase() ? 1 : 0;
              case 'toInt':
                return parseInt(targetObj, 10) || 0;
              case 'toFloat':
                return parseFloat(targetObj) || 0.0;
              case 'trim':
                return targetObj.trim();
              case 'toUpperCase':
                return targetObj.toUpperCase();
              case 'toLowerCase':
                return targetObj.toLowerCase();
              case 'c_str':
                return targetObj;
              default:
                if (typeof targetObj[methodName] === 'function') {
                  return targetObj[methodName](...args);
                }
                throw new Error(`Arduino String method '${methodName}()' not supported`);
            }
          }

          const method = targetObj ? targetObj[methodName] : null;

          if (typeof method !== 'function') {
            throw new Error(`Method '${methodName}' not found on object`);
          }

          const args = [];
          for (const argNode of node.arguments) {
            args.push(yield* this.evaluateExpression(argNode, scope));
          }

          return method.apply(targetObj, args);
        }

        const fnName = node.callee.name;
        const evaluatedArgs = [];
        for (const argNode of node.arguments) {
          evaluatedArgs.push(yield* this.evaluateExpression(argNode, scope));
        }

        if (this.functions.has(fnName)) {
          return yield* this.executeFunction(this.functions.get(fnName), evaluatedArgs, this.globalScope);
        }

        if (this.builtins[fnName]) {
          return this.builtins[fnName](...evaluatedArgs);
        }

        throw new Error(`Arduino function '${fnName}()' is not defined. Check for spelling or missing declaration.`);
      }

      case 'TypeCastExpression': {
        const val = yield* this.evaluateExpression(node.argument, scope);
        if (node.targetType === 'int' || node.targetType === 'long') return Math.trunc(val);
        if (node.targetType === 'float' || node.targetType === 'double') return Number(val);
        if (node.targetType === 'bool' || node.targetType === 'boolean') return Boolean(val) ? 1 : 0;
        return val;
      }
    }

    return 0;
  }

  evaluateExpressionSync(node, scope) {
    const gen = this.evaluateExpression(node, scope);
    let result = gen.next();
    while (!result.done) {
      result = gen.next();
    }
    return result.value;
  }
}
