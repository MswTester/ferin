import { Token, TokenType } from '../types';

export class Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private indentStack: number[] = [0];
  
  private keywords: Record<string, TokenType> = {
    'var': TokenType.VAR,
    'fn': TokenType.FN,
    'class': TokenType.CLASS,
    'if': TokenType.IF,
    'else': TokenType.ELSE,
    'for': TokenType.FOR,
    'while': TokenType.WHILE,
    'loop': TokenType.LOOP,
    'break': TokenType.BREAK,
    'continue': TokenType.CONTINUE,
    'ret': TokenType.RET,
    'import': TokenType.IMPORT,
    'export': TokenType.EXPORT,
    'from': TokenType.FROM,
    'default': TokenType.DEFAULT,
    'as': TokenType.AS,
    'try': TokenType.TRY,
    'catch': TokenType.CATCH,
    'finally': TokenType.FINALLY,
    'comp': TokenType.COMP,
    'type': TokenType.TYPE,
    'enum': TokenType.ENUM,
    'struct': TokenType.STRUCT,
    'implements': TokenType.IMPLEMENTS,
    'static': TokenType.STATIC,
    'private': TokenType.PRIVATE,
    'public': TokenType.PUBLIC,
    'self': TokenType.SELF,
    'super': TokenType.SUPER,
    'ref': TokenType.REF,
    'async': TokenType.ASYNC,
    'await': TokenType.AWAIT,
    'in': TokenType.IN,
    'of': TokenType.OF,
    'pass': TokenType.PASS,
    'true': TokenType.BOOLEAN,
    'false': TokenType.BOOLEAN,
    'null': TokenType.NULL,
    'undefined': TokenType.UNDEFINED
  };
  
  constructor(source: string) {
    this.source = source;
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.source.length) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    // Add final dedents
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      tokens.push(this.createToken(TokenType.DEDENT, ''));
    }
    
    tokens.push(this.createToken(TokenType.EOF, ''));
    return tokens;
  }
  
  private nextToken(): Token | null {
    this.skipWhitespace();
    
    if (this.position >= this.source.length) {
      return null;
    }
    
    const char = this.source[this.position];
    
    // Handle newlines and indentation
    if (char === '\n') {
      const token = this.createToken(TokenType.NEWLINE, char);
      this.advance();
      this.line++;
      this.column = 1;
      return token;
    }
    
    // Handle comments
    if (char === '#') {
      return this.readComment();
    }
    
    // Handle strings
    if (char === '"' || char === "'") {
      return this.readString(char);
    }
    
    // Handle template strings
    if (char === '`') {
      return this.readTemplateString();
    }
    
    // Handle numbers
    if (this.isDigit(char)) {
      return this.readNumber();
    }
    
    // Handle identifiers and keywords
    if (this.isAlpha(char) || char === '_') {
      return this.readIdentifier();
    }
    
    // Handle HTML tags
    if (char === '/') {
      const next = this.source[this.position + 1];
      if (this.isAlpha(next)) {
        return this.readHtmlTag();
      }
      // Division operator
      this.advance();
      return this.createToken(TokenType.DIVIDE, '/');
    }
    
    // Handle operators and punctuation
    return this.readOperator();
  }
  
  private readComment(): Token {
    const start = this.position;
    while (this.position < this.source.length && this.source[this.position] !== '\n') {
      this.advance();
    }
    const value = this.source.slice(start, this.position);
    return this.createToken(TokenType.COMMENT, value);
  }
  
  private readString(quote: string): Token {
    const start = this.position;
    this.advance(); // Skip opening quote
    
    while (this.position < this.source.length && this.source[this.position] !== quote) {
      if (this.source[this.position] === '\\') {
        this.advance(); // Skip escape character
      }
      this.advance();
    }
    
    if (this.position >= this.source.length) {
      throw new Error(`Unterminated string at line ${this.line}:${this.column}`);
    }
    
    this.advance(); // Skip closing quote
    const value = this.source.slice(start, this.position);
    return this.createToken(TokenType.STRING, value);
  }
  
  private readTemplateString(): Token {
    const start = this.position;
    this.advance(); // Skip opening backtick
    
    while (this.position < this.source.length && this.source[this.position] !== '`') {
      if (this.source[this.position] === '\\') {
        this.advance(); // Skip escape character
      }
      this.advance();
    }
    
    if (this.position >= this.source.length) {
      throw new Error(`Unterminated template string at line ${this.line}:${this.column}`);
    }
    
    this.advance(); // Skip closing backtick
    const value = this.source.slice(start, this.position);
    return this.createToken(TokenType.TEMPLATE_STRING, value);
  }
  
  private readNumber(): Token {
    const start = this.position;
    
    while (this.position < this.source.length && (this.isDigit(this.source[this.position]) || this.source[this.position] === '.')) {
      this.advance();
    }
    
    const value = this.source.slice(start, this.position);
    return this.createToken(TokenType.NUMBER, value);
  }
  
  private readIdentifier(): Token {
    const start = this.position;
    
    while (this.position < this.source.length && (this.isAlphaNumeric(this.source[this.position]) || this.source[this.position] === '_')) {
      this.advance();
    }
    
    const value = this.source.slice(start, this.position);
    const tokenType = this.keywords[value] || TokenType.IDENTIFIER;
    return this.createToken(tokenType, value);
  }
  
  private readHtmlTag(): Token {
    const start = this.position;
    this.advance(); // Skip '/'
    
    while (this.position < this.source.length && this.isAlphaNumeric(this.source[this.position])) {
      this.advance();
    }
    
    const value = this.source.slice(start, this.position);
    return this.createToken(TokenType.HTML_TAG_START, value);
  }
  
  private readOperator(): Token {
    const char = this.source[this.position];
    const next = this.source[this.position + 1];
    
    // Two-character operators
    const twoChar = char + next;
    switch (twoChar) {
      case '==': this.advance(); this.advance(); return this.createToken(TokenType.EQUALS, '==');
      case '!=': this.advance(); this.advance(); return this.createToken(TokenType.NOT_EQUALS, '!=');
      case '<=': this.advance(); this.advance(); return this.createToken(TokenType.LESS_EQUAL, '<=');
      case '>=': this.advance(); this.advance(); return this.createToken(TokenType.GREATER_EQUAL, '>=');
      case '&&': this.advance(); this.advance(); return this.createToken(TokenType.AND, '&&');
      case '||': this.advance(); this.advance(); return this.createToken(TokenType.OR, '||');
      case '**': this.advance(); this.advance(); return this.createToken(TokenType.POWER, '**');
    }
    
    // Single-character operators
    this.advance();
    switch (char) {
      case '+': return this.createToken(TokenType.PLUS, '+');
      case '-': return this.createToken(TokenType.MINUS, '-');
      case '*': return this.createToken(TokenType.MULTIPLY, '*');
      case '%': return this.createToken(TokenType.MODULO, '%');
      case '=': return this.createToken(TokenType.ASSIGN, '=');
      case '<': return this.createToken(TokenType.LESS_THAN, '<');
      case '>': return this.createToken(TokenType.GREATER_THAN, '>');
      case '!': return this.createToken(TokenType.NOT, '!');
      case ':': return this.createToken(TokenType.COLON, ':');
      case ';': return this.createToken(TokenType.SEMICOLON, ';');
      case ',': return this.createToken(TokenType.COMMA, ',');
      case '.': return this.createToken(TokenType.DOT, '.');
      case '?': return this.createToken(TokenType.QUESTION, '?');
      case '(': return this.createToken(TokenType.LEFT_PAREN, '(');
      case ')': return this.createToken(TokenType.RIGHT_PAREN, ')');
      case '[': return this.createToken(TokenType.LEFT_BRACKET, '[');
      case ']': return this.createToken(TokenType.RIGHT_BRACKET, ']');
      case '{': return this.createToken(TokenType.LEFT_BRACE, '{');
      case '}': return this.createToken(TokenType.RIGHT_BRACE, '}');
      default:
        throw new Error(`Unexpected character '${char}' at line ${this.line}:${this.column}`);
    }
  }
  
  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (char === ' ' || char === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }
  
  private advance(): void {
    this.position++;
    this.column++;
  }
  
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
  
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }
  
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
  
  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length
    };
  }
  
  handleIndentation(tokens: Token[]): Token[] {
    const result: Token[] = [];
    let i = 0;
    
    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token.type === TokenType.NEWLINE) {
        result.push(token);
        i++;
        
        // Check for indentation after newline
        let indentLevel = 0;
        while (i < tokens.length && tokens[i].type === TokenType.COMMENT) {
          result.push(tokens[i]);
          i++;
        }
        
        if (i < tokens.length && tokens[i].line === token.line + 1) {
          const nextToken = tokens[i];
          indentLevel = nextToken.column - 1;
          
          const currentIndent = this.indentStack[this.indentStack.length - 1];
          
          if (indentLevel > currentIndent) {
            this.indentStack.push(indentLevel);
            result.push(this.createToken(TokenType.INDENT, ''));
          } else if (indentLevel < currentIndent) {
            while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indentLevel) {
              this.indentStack.pop();
              result.push(this.createToken(TokenType.DEDENT, ''));
            }
          }
        }
      } else {
        result.push(token);
        i++;
      }
    }
    
    return result;
  }
}