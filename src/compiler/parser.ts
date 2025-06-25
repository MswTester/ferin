import { Token, TokenType, ASTNode, Program, Statement, Expression, VariableDeclaration, FunctionDeclaration, ClassDeclaration, IfStatement, ForStatement, WhileStatement, LoopStatement, ReturnStatement, ImportDeclaration, ExportDeclaration, ComponentDeclaration, JSXElement, BinaryExpression, UnaryExpression, CallExpression, MemberExpression, Identifier, Literal, ArrayExpression, ObjectExpression, Parameter, JSXAttribute, ImportSpecifier, ExportSpecifier } from '../types';

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  
  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(token => token.type !== TokenType.COMMENT);
  }
  
  parse(): Program {
    const body: Statement[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }
    
    return {
      type: 'Program',
      body,
      line: 0,
      column: 0
    };
  }
  
  private parseStatement(): Statement | null {
    this.skipNewlines();
    
    if (this.isAtEnd()) return null;
    
    const token = this.currentToken();
    
    switch (token.type) {
      case TokenType.VAR:
        return this.parseVariableDeclaration();
      case TokenType.FN:
        return this.parseFunctionDeclaration();
      case TokenType.ASYNC:
        // Check if it's async function
        if (this.tokens[this.position + 1]?.type === TokenType.FN) {
          this.advance(); // consume 'async'
          return this.parseFunctionDeclaration(true);
        }
        return this.parseExpressionStatement() as any;
      case TokenType.CLASS:
        return this.parseClassDeclaration();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.LOOP:
        return this.parseLoopStatement();
      case TokenType.RET:
        return this.parseReturnStatement();
      case TokenType.IMPORT:
        return this.parseImportDeclaration();
      case TokenType.EXPORT:
        return this.parseExportDeclaration();
      case TokenType.COMP:
        return this.parseComponentDeclaration();
      case TokenType.HTML_TAG_START:
        return this.parseJSXElement();
      case TokenType.IDENTIFIER:
        // Check if it's an assignment
        if (this.peekNext()?.type === TokenType.ASSIGN) {
          return this.parseAssignmentStatement();
        }
        return this.parseExpressionStatement() as any;
      default:
        return this.parseExpressionStatement() as any;
    }
  }
  
  private parseVariableDeclaration(): VariableDeclaration {
    const token = this.consume(TokenType.VAR);
    const identifier = this.consume(TokenType.IDENTIFIER).value;
    
    let typeAnnotation: string | undefined;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.consume(TokenType.IDENTIFIER).value;
    }
    
    let initializer: Expression | undefined;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.parseExpression();
    }
    
    return {
      type: 'VariableDeclaration',
      identifier,
      typeAnnotation,
      initializer,
      line: token.line,
      column: token.column
    };
  }
  
  private parseFunctionDeclaration(isAsync: boolean = false): FunctionDeclaration {
    const token = this.consume(TokenType.FN);
    const name = this.consume(TokenType.IDENTIFIER).value;
    
    this.consume(TokenType.LEFT_PAREN);
    const parameters: Parameter[] = [];
    
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const paramName = this.consume(TokenType.IDENTIFIER).value;
        let paramType: string | undefined;
        let defaultValue: Expression | undefined;
        let optional = false;
        
        if (this.match(TokenType.QUESTION)) {
          optional = true;
        }
        
        if (this.match(TokenType.COLON)) {
          paramType = this.consume(TokenType.IDENTIFIER).value;
        }
        
        if (this.match(TokenType.ASSIGN)) {
          defaultValue = this.parseExpression();
        }
        
        parameters.push({
          name: paramName,
          type: paramType,
          defaultValue,
          optional
        });
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN);
    
    let returnType: string | undefined;
    if (this.match(TokenType.COLON)) {
      if (this.check(TokenType.IDENTIFIER)) {
        returnType = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.COLON);
      }
    } else {
      this.consume(TokenType.COLON);
    }
    this.skipNewlinesAndIndents();
    
    const body = this.parseBlock();
    
    return {
      type: 'FunctionDeclaration',
      name,
      parameters,
      returnType,
      body,
      isAsync,
      line: token.line,
      column: token.column
    };
  }
  
  private parseClassDeclaration(): ClassDeclaration {
    const token = this.consume(TokenType.CLASS);
    const name = this.consume(TokenType.IDENTIFIER).value;
    
    let superClass: string | undefined;
    if (this.match(TokenType.LEFT_PAREN)) {
      superClass = this.consume(TokenType.IDENTIFIER).value;
      this.consume(TokenType.RIGHT_PAREN);
    }
    
    let implementsClasses: string[] = [];
    if (this.match(TokenType.IMPLEMENTS)) {
      do {
        implementsClasses.push(this.consume(TokenType.IDENTIFIER).value);
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.COLON);
    this.skipNewlinesAndIndents();
    
    const body = this.parseClassBody();
    
    return {
      type: 'ClassDeclaration',
      name,
      superClass,
      implements: implementsClasses,
      body,
      line: token.line,
      column: token.column
    };
  }
  
  private parseClassBody(): any[] {
    const members: any[] = [];
    
    while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.check(TokenType.DEDENT) || this.isAtEnd()) break;
      
      let isStatic = false;
      let isPrivate = false;
      
      if (this.match(TokenType.STATIC)) {
        isStatic = true;
      }
      
      if (this.match(TokenType.PRIVATE)) {
        isPrivate = true;
      }
      
      if (this.check(TokenType.FN)) {
        const method = this.parseFunctionDeclaration();
        members.push({
          ...method,
          type: 'MethodDefinition',
          isStatic,
          isPrivate,
          isConstructor: method.name === 'init'
        } as any);
      } else {
        const name = this.consume(TokenType.IDENTIFIER).value;
        let typeAnnotation: string | undefined;
        let initializer: Expression | undefined;
        
        if (this.match(TokenType.COLON)) {
          typeAnnotation = this.consume(TokenType.IDENTIFIER).value;
        }
        
        if (this.match(TokenType.ASSIGN)) {
          initializer = this.parseExpression();
        }
        
        members.push({
          type: 'PropertyDefinition',
          name,
          typeAnnotation,
          initializer,
          isStatic,
          isPrivate,
          line: this.currentToken().line,
          column: this.currentToken().column
        } as any);
      }
    }
    
    return members;
  }
  
  private parseIfStatement(): IfStatement {
    const token = this.consume(TokenType.IF);
    const condition = this.parseExpression();
    this.consume(TokenType.COLON);
    this.skipNewlinesAndIndents();
    
    const consequent = this.parseBlock();
    
    let alternate: Statement[] | IfStatement | undefined;
    
    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        alternate = this.parseIfStatement();
      } else {
        this.consume(TokenType.COLON);
        this.skipNewlinesAndIndents();
        alternate = this.parseBlock();
      }
    }
    
    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      line: token.line,
      column: token.column
    };
  }
  
  private parseForStatement(): ForStatement {
    const token = this.consume(TokenType.FOR);
    this.consume(TokenType.LEFT_PAREN);
    
    let variable: string;
    let index: string | undefined;
    let isOf = false;
    
    if (this.check(TokenType.LEFT_BRACKET)) {
      this.consume(TokenType.LEFT_BRACKET);
      variable = this.consume(TokenType.IDENTIFIER).value;
      if (this.match(TokenType.COMMA)) {
        index = this.consume(TokenType.IDENTIFIER).value;
      }
      this.consume(TokenType.RIGHT_BRACKET);
    } else {
      variable = this.consume(TokenType.IDENTIFIER).value;
      if (this.match(TokenType.COMMA)) {
        index = this.consume(TokenType.IDENTIFIER).value;
      }
    }
    
    if (this.match(TokenType.OF)) {
      isOf = true;
    } else {
      this.consume(TokenType.IN);
    }
    
    const iterable = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN);
    this.consume(TokenType.COLON);
    this.skipNewlinesAndIndents();
    
    const body = this.parseBlock();
    
    return {
      type: 'ForStatement',
      variable,
      index,
      iterable,
      body,
      isOf,
      line: token.line,
      column: token.column
    };
  }
  
  private parseWhileStatement(): WhileStatement {
    const token = this.consume(TokenType.WHILE);
    const condition = this.parseExpression();
    this.consume(TokenType.COLON);
    this.skipNewlinesAndIndents();
    
    const body = this.parseBlock();
    
    return {
      type: 'WhileStatement',
      condition,
      body,
      line: token.line,
      column: token.column
    };
  }
  
  private parseLoopStatement(): LoopStatement {
    const token = this.consume(TokenType.LOOP);
    this.consume(TokenType.COLON);
    this.skipNewlinesAndIndents();
    
    const body = this.parseBlock();
    
    return {
      type: 'LoopStatement',
      body,
      line: token.line,
      column: token.column
    };
  }
  
  private parseReturnStatement(): ReturnStatement {
    const token = this.consume(TokenType.RET);
    
    let value: Expression | undefined;
    if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      value = this.parseExpression();
    }
    
    return {
      type: 'ReturnStatement',
      value,
      line: token.line,
      column: token.column
    };
  }
  
  private parseImportDeclaration(): ImportDeclaration {
    const token = this.consume(TokenType.IMPORT);
    const specifiers: ImportSpecifier[] = [];
    
    if (this.check(TokenType.LEFT_BRACE)) {
      this.consume(TokenType.LEFT_BRACE);
      do {
        const imported = this.consume(TokenType.IDENTIFIER).value;
        let local = imported;
        
        if (this.match(TokenType.AS)) {
          local = this.consume(TokenType.IDENTIFIER).value;
        }
        
        specifiers.push({
          type: 'ImportSpecifier',
          imported,
          local
        });
      } while (this.match(TokenType.COMMA));
      
      this.consume(TokenType.RIGHT_BRACE);
    } else if (this.match(TokenType.MULTIPLY)) {
      this.consume(TokenType.AS);
      const local = this.consume(TokenType.IDENTIFIER).value;
      specifiers.push({
        type: 'ImportNamespaceSpecifier',
        local
      });
    } else {
      const local = this.consume(TokenType.IDENTIFIER).value;
      specifiers.push({
        type: 'ImportDefaultSpecifier',
        local
      });
    }
    
    this.consume(TokenType.FROM);
    const source = this.consume(TokenType.STRING).value.slice(1, -1);
    
    return {
      type: 'ImportDeclaration',
      source,
      specifiers,
      line: token.line,
      column: token.column
    };
  }
  
  private parseExportDeclaration(): ExportDeclaration {
    const token = this.consume(TokenType.EXPORT);
    
    if (this.match(TokenType.DEFAULT)) {
      const declaration = this.parseStatement();
      return {
        type: 'ExportDeclaration',
        declaration: declaration || undefined,
        isDefault: true,
        line: token.line,
        column: token.column
      };
    }
    
    if (this.check(TokenType.LEFT_BRACE)) {
      this.consume(TokenType.LEFT_BRACE);
      const specifiers: ExportSpecifier[] = [];
      
      do {
        const local = this.consume(TokenType.IDENTIFIER).value;
        let exported = local;
        
        if (this.match(TokenType.AS)) {
          exported = this.consume(TokenType.IDENTIFIER).value;
        }
        
        specifiers.push({
          type: 'ExportSpecifier',
          local,
          exported
        });
      } while (this.match(TokenType.COMMA));
      
      this.consume(TokenType.RIGHT_BRACE);
      
      let source: string | undefined;
      if (this.match(TokenType.FROM)) {
        source = this.consume(TokenType.STRING).value.slice(1, -1);
      }
      
      return {
        type: 'ExportDeclaration',
        specifiers,
        source,
        line: token.line,
        column: token.column
      };
    }
    
    const declaration = this.parseStatement();
    return {
      type: 'ExportDeclaration',
      declaration: declaration || undefined,
      line: token.line,
      column: token.column
    };
  }
  
  private parseComponentDeclaration(): ComponentDeclaration {
    const token = this.consume(TokenType.COMP);
    const name = this.consume(TokenType.IDENTIFIER).value;
    
    this.consume(TokenType.LEFT_PAREN);
    const parameters: Parameter[] = [];
    
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const paramName = this.consume(TokenType.IDENTIFIER).value;
        parameters.push({ name: paramName });
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN);
    this.consume(TokenType.COLON);
    this.skipNewlinesAndIndents();
    
    const body = this.parseBlock();
    
    return {
      type: 'ComponentDeclaration',
      name,
      parameters,
      body,
      line: token.line,
      column: token.column
    };
  }
  
  private parseJSXElement(): JSXElement {
    const token = this.consume(TokenType.HTML_TAG_START);
    const tagName = token.value.slice(1); // Remove '/'
    
    const attributes: JSXAttribute[] = [];
    const children: (JSXElement | Expression | string)[] = [];
    
    // Parse attributes on the same line
    while (!this.check(TokenType.NEWLINE) && !this.check(TokenType.COLON) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const attrName = this.consume(TokenType.IDENTIFIER).value;
        
        if (this.match(TokenType.ASSIGN)) {
          if (this.check(TokenType.LEFT_BRACE)) {
            this.consume(TokenType.LEFT_BRACE);
            const value = this.parseExpression();
            this.consume(TokenType.RIGHT_BRACE);
            attributes.push({ name: attrName, value });
          } else if (this.check(TokenType.STRING)) {
            const value = this.consume(TokenType.STRING).value.slice(1, -1);
            attributes.push({ name: attrName, value });
          } else {
            const value = this.parseExpression();
            attributes.push({ name: attrName, value });
          }
        } else {
          attributes.push({ name: attrName });
        }
      } else {
        break;
      }
    }
    
    // Parse children if there's a colon (block form)
    if (this.match(TokenType.COLON)) {
      this.skipNewlinesAndIndents();
      
      while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
        this.skipNewlines();
        if (this.check(TokenType.DEDENT) || this.isAtEnd()) break;
        
        if (this.check(TokenType.HTML_TAG_START)) {
          children.push(this.parseJSXElement());
        } else if (this.check(TokenType.STRING)) {
          const str = this.consume(TokenType.STRING).value.slice(1, -1);
          children.push(str);
        } else if (this.check(TokenType.LEFT_BRACE)) {
          this.consume(TokenType.LEFT_BRACE);
          const expr = this.parseExpression();
          this.consume(TokenType.RIGHT_BRACE);
          children.push(expr);
        } else {
          const expr = this.parseExpression();
          children.push(expr);
        }
      }
    } else if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      // Parse inline content
      if (this.check(TokenType.STRING)) {
        const str = this.consume(TokenType.STRING).value.slice(1, -1);
        children.push(str);
      } else if (this.check(TokenType.LEFT_BRACE)) {
        this.consume(TokenType.LEFT_BRACE);
        const expr = this.parseExpression();
        this.consume(TokenType.RIGHT_BRACE);
        children.push(expr);
      }
    }
    
    return {
      type: 'JSXElement',
      tagName,
      attributes,
      children,
      line: token.line,
      column: token.column
    };
  }
  
  private parseAssignmentStatement(): Statement {
    const identifier = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.ASSIGN);
    const value = this.parseExpression();
    
    return {
      type: 'AssignmentExpression',
      left: {
        type: 'Identifier',
        name: identifier,
        line: this.previous().line,
        column: this.previous().column
      },
      operator: '=',
      right: value,
      line: this.previous().line,
      column: this.previous().column
    } as any;
  }
  
  private parseExpressionStatement(): Statement {
    const expr = this.parseExpression();
    return {
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      column: expr.column
    } as any;
  }
  
  private parseExpression(): Expression {
    return this.parseLogicalOr();
  }
  
  private parseLogicalOr(): Expression {
    let expr = this.parseLogicalAnd();
    
    while (this.match(TokenType.OR)) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parseLogicalAnd(): Expression {
    let expr = this.parseEquality();
    
    while (this.match(TokenType.AND)) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parseEquality(): Expression {
    let expr = this.parseComparison();
    
    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parseComparison(): Expression {
    let expr = this.parseAddition();
    
    while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUAL, TokenType.LESS_THAN, TokenType.LESS_EQUAL)) {
      const operator = this.previous().value;
      const right = this.parseAddition();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parseAddition(): Expression {
    let expr = this.parseMultiplication();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.parseMultiplication();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parseMultiplication(): Expression {
    let expr = this.parsePower();
    
    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.parsePower();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parsePower(): Expression {
    let expr = this.parseUnary();
    
    while (this.match(TokenType.POWER)) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column
      } as any;
    }
    
    return expr;
  }
  
  private parseUnary(): Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.AWAIT)) {
      const operator = this.previous().value;
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator,
        operand,
        line: operand.line,
        column: operand.column
      } as any;
    }
    
    return this.parseCall();
  }
  
  private parseCall(): Expression {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        const args: Expression[] = [];
        
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        
        this.consume(TokenType.RIGHT_PAREN);
        
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
          line: expr.line,
          column: expr.column
        } as any;
      } else if (this.match(TokenType.DOT)) {
        const property = this.consume(TokenType.IDENTIFIER);
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: {
            type: 'Identifier',
            name: property.value,
            line: property.line,
            column: property.column
          },
          computed: false,
          line: expr.line,
          column: expr.column
        } as any;
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const property = this.parseExpression();
        this.consume(TokenType.RIGHT_BRACKET);
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true,
          line: expr.line,
          column: expr.column
        } as any;
      } else {
        break;
      }
    }
    
    return expr;
  }
  
  private parsePrimary(): Expression {
    if (this.match(TokenType.BOOLEAN)) {
      const token = this.previous();
      return {
        type: 'Literal',
        value: token.value === 'true',
        raw: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.NULL)) {
      const token = this.previous();
      return {
        type: 'Literal',
        value: null,
        raw: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.UNDEFINED)) {
      const token = this.previous();
      return {
        type: 'Literal',
        value: undefined,
        raw: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.NUMBER)) {
      const token = this.previous();
      return {
        type: 'Literal',
        value: parseFloat(token.value),
        raw: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      return {
        type: 'Literal',
        value: token.value.slice(1, -1),
        raw: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.TEMPLATE_STRING)) {
      const token = this.previous();
      return {
        type: 'Literal',
        value: token.value.slice(1, -1),
        raw: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      return {
        type: 'Identifier',
        name: token.value,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.LEFT_BRACKET)) {
      const elements: Expression[] = [];
      
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          elements.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      
      const token = this.consume(TokenType.RIGHT_BRACKET);
      return {
        type: 'ArrayExpression',
        elements,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.LEFT_BRACE)) {
      const properties: any[] = [];
      
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          const key = this.parseExpression();
          this.consume(TokenType.COLON);
          const value = this.parseExpression();
          properties.push({ key, value });
        } while (this.match(TokenType.COMMA));
      }
      
      const token = this.consume(TokenType.RIGHT_BRACE);
      return {
        type: 'ObjectExpression',
        properties,
        line: token.line,
        column: token.column
      } as any;
    }
    
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN);
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.currentToken().value} at line ${this.currentToken().line}:${this.currentToken().column}`);
  }
  
  private parseBlock(): Statement[] {
    const statements: Statement[] = [];
    
    while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.check(TokenType.DEDENT) || this.isAtEnd()) break;
      
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    if (this.check(TokenType.DEDENT)) {
      this.advance();
    }
    
    return statements;
  }
  
  private skipNewlines(): void {
    while (this.match(TokenType.NEWLINE)) {
      // Skip newlines
    }
  }
  
  private skipNewlinesAndIndents(): void {
    while (this.match(TokenType.NEWLINE, TokenType.INDENT)) {
      // Skip newlines and indents
    }
  }
  
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.currentToken().type === type;
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.position++;
    return this.previous();
  }
  
  private isAtEnd(): boolean {
    return this.currentToken().type === TokenType.EOF;
  }
  
  private currentToken(): Token {
    return this.tokens[this.position];
  }
  
  private previous(): Token {
    return this.tokens[this.position - 1];
  }
  
  private consume(type: TokenType): Token {
    if (this.check(type)) {
      return this.advance();
    }
    
    throw new Error(`Expected ${type} but got ${this.currentToken().type} at line ${this.currentToken().line}:${this.currentToken().column}`);
  }
  
  private peekNext(): Token | undefined {
    if (this.position + 1 >= this.tokens.length) {
      return undefined;
    }
    return this.tokens[this.position + 1];
  }
}