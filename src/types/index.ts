export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED',
  
  // Identifiers
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords
  VAR = 'VAR',
  FN = 'FN',
  CLASS = 'CLASS',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  LOOP = 'LOOP',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  RET = 'RET',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  DEFAULT = 'DEFAULT',
  AS = 'AS',
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',
  COMP = 'COMP',
  TYPE = 'TYPE',
  ENUM = 'ENUM',
  STRUCT = 'STRUCT',
  IMPLEMENTS = 'IMPLEMENTS',
  STATIC = 'STATIC',
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  SELF = 'SELF',
  SUPER = 'SUPER',
  REF = 'REF',
  ASYNC = 'ASYNC',
  AWAIT = 'AWAIT',
  IN = 'IN',
  OF = 'OF',
  PASS = 'PASS',
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  POWER = 'POWER',
  ASSIGN = 'ASSIGN',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // Punctuation
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  DOT = 'DOT',
  QUESTION = 'QUESTION',
  
  // Brackets
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  
  // Special
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
  
  // HTML/JSX-like
  HTML_TAG_START = 'HTML_TAG_START',
  HTML_TAG_END = 'HTML_TAG_END',
  HTML_SELF_CLOSE = 'HTML_SELF_CLOSE',
  
  // Template literals
  TEMPLATE_STRING = 'TEMPLATE_STRING',
  TEMPLATE_EXPR_START = 'TEMPLATE_EXPR_START',
  TEMPLATE_EXPR_END = 'TEMPLATE_EXPR_END'
}

export interface ASTNode {
  type: string;
  line: number;
  column: number;
}

export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

export interface Statement extends ASTNode {}

export interface Expression extends ASTNode {}

export interface VariableDeclaration extends Statement {
  type: 'VariableDeclaration';
  identifier: string;
  typeAnnotation?: string;
  initializer?: Expression;
}

export interface FunctionDeclaration extends Statement {
  type: 'FunctionDeclaration';
  name: string;
  parameters: Parameter[];
  returnType?: string;
  body: Statement[];
  isAsync?: boolean;
}

export interface Parameter {
  name: string;
  type?: string;
  defaultValue?: Expression;
  optional?: boolean;
}

export interface ClassDeclaration extends Statement {
  type: 'ClassDeclaration';
  name: string;
  superClass?: string;
  implements?: string[];
  body: ClassMember[];
}

export interface ClassMember extends ASTNode {
  isStatic?: boolean;
  isPrivate?: boolean;
}

export interface MethodDefinition extends ClassMember {
  type: 'MethodDefinition';
  name: string;
  parameters: Parameter[];
  returnType?: string;
  body: Statement[];
  isConstructor?: boolean;
  isAsync?: boolean;
}

export interface PropertyDefinition extends ClassMember {
  type: 'PropertyDefinition';
  name: string;
  typeAnnotation?: string;
  initializer?: Expression;
}

export interface IfStatement extends Statement {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate?: Statement[] | IfStatement;
}

export interface ForStatement extends Statement {
  type: 'ForStatement';
  variable: string;
  index?: string;
  iterable: Expression;
  body: Statement[];
  isOf?: boolean;
}

export interface WhileStatement extends Statement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

export interface LoopStatement extends Statement {
  type: 'LoopStatement';
  body: Statement[];
}

export interface ReturnStatement extends Statement {
  type: 'ReturnStatement';
  value?: Expression;
}

export interface AssignmentExpression extends Expression {
  type: 'AssignmentExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface ExpressionStatement extends Statement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface ImportDeclaration extends Statement {
  type: 'ImportDeclaration';
  source: string;
  specifiers: ImportSpecifier[];
}

export interface ImportSpecifier {
  type: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';
  imported?: string;
  local: string;
}

export interface ExportDeclaration extends Statement {
  type: 'ExportDeclaration';
  declaration?: Statement;
  specifiers?: ExportSpecifier[];
  source?: string;
  isDefault?: boolean;
}

export interface ExportSpecifier {
  type: 'ExportSpecifier';
  local: string;
  exported: string;
}

export interface ComponentDeclaration extends Statement {
  type: 'ComponentDeclaration';
  name: string;
  parameters: Parameter[];
  body: Statement[];
}

export interface JSXElement extends Expression {
  type: 'JSXElement';
  tagName: string;
  attributes: JSXAttribute[];
  children: (JSXElement | Expression | string)[];
  selfClosing?: boolean;
}

export interface JSXAttribute {
  name: string;
  value?: Expression | string;
}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends Expression {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
}

export interface CallExpression extends Expression {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends Expression {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
}

export interface Identifier extends Expression {
  type: 'Identifier';
  name: string;
}

export interface Literal extends Expression {
  type: 'Literal';
  value: any;
  raw: string;
}

export interface ArrayExpression extends Expression {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface ObjectExpression extends Expression {
  type: 'ObjectExpression';
  properties: Property[];
}

export interface Property {
  key: Expression;
  value: Expression;
}

export interface CompiledResult {
  js: string;
  css?: string;
  html?: string;
}