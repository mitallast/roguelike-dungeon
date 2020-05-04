interface Token {
  value: any;
  type: string;
}

enum TokenizerStates {
  Started = 1,
  ParsingNumber = 2,
  ParsingStringStarted = 3,
  ParsingString = 4,
  ParsingStringFinished = 5,
  ParsingFunction = 6,
  Finished = 7,
  ParsingContext = 8,
  ParsingBracket = 9,
  Error = 10
}

enum KnownStringComponents {
  Delimiter = 1,
  Digit = 2,
  Bracket = 3,
  Other = 4,
  ContextBracket = 5,
  Quote = 6
}

const tokenStateMachine: Partial<Record<TokenizerStates, Required<Record<KnownStringComponents, TokenizerStates>>>> = {
  [TokenizerStates.Started]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.Started,
    [KnownStringComponents.Digit]: TokenizerStates.ParsingNumber,
    [KnownStringComponents.Bracket]: TokenizerStates.ParsingBracket,
    [KnownStringComponents.Other]: TokenizerStates.ParsingFunction,
    [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingContext,
    [KnownStringComponents.Quote]: TokenizerStates.ParsingStringStarted
  },
  [TokenizerStates.ParsingNumber]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
    [KnownStringComponents.Digit]: TokenizerStates.ParsingNumber,
    [KnownStringComponents.Bracket]: TokenizerStates.Finished,
    [KnownStringComponents.Other]: TokenizerStates.Finished,
    [KnownStringComponents.ContextBracket]: TokenizerStates.Error,
    [KnownStringComponents.Quote]: TokenizerStates.Error
  },
  [TokenizerStates.ParsingFunction]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
    [KnownStringComponents.Digit]: TokenizerStates.ParsingFunction,
    [KnownStringComponents.Bracket]: TokenizerStates.Finished,
    [KnownStringComponents.Other]: TokenizerStates.ParsingFunction,
    [KnownStringComponents.ContextBracket]: TokenizerStates.Error,
    [KnownStringComponents.Quote]: TokenizerStates.Error
  },
  [TokenizerStates.ParsingContext]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
    [KnownStringComponents.Digit]: TokenizerStates.ParsingContext,
    [KnownStringComponents.Bracket]: TokenizerStates.Finished,
    [KnownStringComponents.Other]: TokenizerStates.ParsingContext,
    [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingContext,
    [KnownStringComponents.Quote]: TokenizerStates.Error
  },
  [TokenizerStates.ParsingBracket]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
    [KnownStringComponents.Digit]: TokenizerStates.Finished,
    [KnownStringComponents.Bracket]: TokenizerStates.Finished,
    [KnownStringComponents.Other]: TokenizerStates.Finished,
    [KnownStringComponents.ContextBracket]: TokenizerStates.Finished,
    [KnownStringComponents.Quote]: TokenizerStates.Finished
  },
  [TokenizerStates.ParsingStringStarted]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.ParsingString,
    [KnownStringComponents.Digit]: TokenizerStates.ParsingString,
    [KnownStringComponents.Bracket]: TokenizerStates.ParsingString,
    [KnownStringComponents.Other]: TokenizerStates.ParsingString,
    [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingString,
    [KnownStringComponents.Quote]: TokenizerStates.Finished
  },
  [TokenizerStates.ParsingString]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.ParsingString,
    [KnownStringComponents.Digit]: TokenizerStates.ParsingString,
    [KnownStringComponents.Bracket]: TokenizerStates.ParsingString,
    [KnownStringComponents.Other]: TokenizerStates.ParsingString,
    [KnownStringComponents.ContextBracket]: TokenizerStates.ParsingString,
    [KnownStringComponents.Quote]: TokenizerStates.ParsingStringFinished
  },
  [TokenizerStates.ParsingStringFinished]: {
    [KnownStringComponents.Delimiter]: TokenizerStates.Finished,
    [KnownStringComponents.Digit]: TokenizerStates.Finished,
    [KnownStringComponents.Bracket]: TokenizerStates.Finished,
    [KnownStringComponents.Other]: TokenizerStates.Finished,
    [KnownStringComponents.ContextBracket]: TokenizerStates.Finished,
    [KnownStringComponents.Quote]: TokenizerStates.Finished
  }
};

interface ExpressionOperation {
  readonly priority: number;
  readonly variable: boolean;
  readonly apply: (...props: any[]) => any;
}

export class Expression {
  private _operations: Partial<Record<string, ExpressionOperation>> = {
    "+": {
      priority: 0,
      variable: false,
      apply: (a: any, b: any): any => a + b
    },
    "-": {
      priority: 0,
      variable: false,
      apply: (a: number, b: number): any => a - b
    },
    "*": {
      priority: 1,
      variable: false,
      apply: (a: number, b: number): any => a * b
    },
    "/": {
      priority: 1,
      variable: false,
      apply: (a: number, b: number): any => a / b
    },
    "%": {
      priority: 1,
      variable: false,
      apply: (a: number, b: number): any => a % b
    },
    or: {
      priority: 0,
      variable: false,
      apply: (a: any, b: any): any => a || b
    },
    and: {
      priority: 1,
      variable: false,
      apply: (a: any, b: any): any => a && b
    },
    "!": {
      priority: 2,
      variable: false,
      apply: (a: any): any => !a
    },
    true: {
      priority: 100,
      variable: false,
      apply: (): any => true
    },
    false: {
      priority: 100,
      variable: false,
      apply: (): any => false
    },
    $$getContextValue: {
      priority: 100,
      variable: false,
      apply: (contextPropertyName: string, context: Partial<Record<string, any>>): any => {
        const propertyName = contextPropertyName.substring(1, contextPropertyName.length - 1);
        return context[propertyName]!;
      }
    }
  };
  private static digits = "0123456789.";
  private static brackets = "()";
  private static contextBrackets = "{}";
  private static delimiters = " ,\r\r\n";
  private static quotes = "'\"";

  private _context: Partial<Record<string, any>> = {};

  private static classifySymbol(symbol: string): KnownStringComponents {
    if (Expression.delimiters.indexOf(symbol) !== -1) {
      return KnownStringComponents.Delimiter;
    } else if (Expression.brackets.indexOf(symbol) !== -1) {
      return KnownStringComponents.Bracket;
    } else if (Expression.digits.indexOf(symbol) !== -1) {
      return KnownStringComponents.Digit;
    } else if (Expression.contextBrackets.indexOf(symbol) !== -1) {
      return KnownStringComponents.ContextBracket;
    } else if (Expression.quotes.indexOf(symbol) !== -1) {
      return KnownStringComponents.Quote;
    } else {
      return KnownStringComponents.Other;
    }
  }

  private isOfMoreOrEqualPriority(currentOp: string, otherOp: string): boolean {
    return (this._operations[currentOp]!.priority <= this._operations[otherOp]!.priority);
  }

  private scanToken(str: string, start: number): { workingState: TokenizerStates; tokenString: string; pos: number } {
    let state: TokenizerStates = TokenizerStates.Started;
    let workingState = TokenizerStates.Error;
    let tokenString = "";
    let i = start;
    while (i < str.length && state !== TokenizerStates.Finished && state !== TokenizerStates.Error) {
      const symbolClass = Expression.classifySymbol(str[i]);
      state = tokenStateMachine[state]![symbolClass];
      if (
        state === TokenizerStates.ParsingFunction &&
        this._operations[tokenString] !== undefined
      ) {
        state = TokenizerStates.Finished;
      }
      if (
        state === TokenizerStates.ParsingFunction ||
        state === TokenizerStates.ParsingNumber ||
        state === TokenizerStates.ParsingBracket ||
        state === TokenizerStates.ParsingContext ||
        state === TokenizerStates.ParsingString
      ) {
        workingState = state;
        tokenString += str[i++];
      } else if (
        state === TokenizerStates.Started ||
        state === TokenizerStates.ParsingStringStarted ||
        state === TokenizerStates.ParsingStringFinished
      ) {
        i++;
      }
    }
    if (tokenString === "") {
      workingState = TokenizerStates.Error;
    }
    return {
      workingState,
      tokenString,
      pos: i
    };
  }

  private convertToRPN(tokens: Token[]): Token[] {
    const stack: Token[] = [];
    const rpn: Token[] = [];
    let currToken: Token;

    let j = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === "n") {
        rpn[j++] = tokens[i];
        continue;
      }
      if (tokens[i].type === "(") {
        stack.push(tokens[i]);
        continue;
      }
      if (tokens[i].type === ")") {
        do {
          currToken = stack.pop()!;
          rpn[j++] = currToken;
        } while (rpn[j - 1].type !== "(");
        j--;
        continue;
      }
      if (Object.keys(this._operations).indexOf(tokens[i].type) !== -1) {
        if (stack.length > 0) {
          do {
            currToken = stack.pop()!;
            rpn[j++] = currToken;
          } while (
            stack.length > 0 &&
            Expression.brackets.indexOf(rpn[j - 1].type) === -1 &&
            this.isOfMoreOrEqualPriority(tokens[i].type, rpn[j - 1].type)
            );
          if (
            Expression.brackets.indexOf(rpn[j - 1].type) !== -1 ||
            !this.isOfMoreOrEqualPriority(tokens[i].type, rpn[j - 1].type)
          ) {
            stack.push(currToken);
            j--;
          }
        }
        stack.push(tokens[i]);
      }
    }
    while (stack.length > 0) {
      currToken = stack.pop()!;
      rpn[j++] = currToken;
    }
    return rpn;
  }

  private calculateRPN(rpn: Token[]): any {
    const operands: Token[] = [];
    if (rpn.length === 0) {
      return null;
    }
    for (let i = 0; i < rpn.length; i++) {
      if (rpn[i].type === "n") {
        operands.push(rpn[i]);
      } else {
        const op = this._operations[rpn[i].type]!;
        const func = op.apply;
        const len = op.variable ? operands.length : func.length;
        const args = operands.splice(operands.length - len).map(op => op.value);
        const result = func(...args);
        operands.push({type: "n", value: result});
      }
    }
    return operands.shift()?.value || null;
  }

  private tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    for (let i = 0; i < expression.length;) {
      const tokenCandidate = this.scanToken(expression, i);
      if (tokenCandidate.workingState !== TokenizerStates.Error) {
        if (tokenCandidate.workingState === TokenizerStates.ParsingNumber) {
          tokens.push({
            type: "n",
            value:
              tokenCandidate.tokenString.indexOf(".") !== -1
                ? parseFloat(tokenCandidate.tokenString)
                : parseInt(tokenCandidate.tokenString)
          });
        } else if (tokenCandidate.workingState === TokenizerStates.ParsingContext) {
          tokens.push({
            type: "$$getContextValue",
            value: null
          });
          tokens.push({
            type: "n",
            value: tokenCandidate.tokenString
          });
          tokens.push({
            type: "n",
            value: this._context
          });
        } else if (tokenCandidate.workingState === TokenizerStates.ParsingString) {
          tokens.push({
            type: "n",
            value: tokenCandidate.tokenString
          });
        } else {
          tokens.push({
            type: tokenCandidate.tokenString,
            value: null
          });
        }
      }
      i = tokenCandidate.pos;
    }
    return tokens;
  }

  register(name: string, priority: number, variable: boolean, apply: (...props: any[]) => any): void {
    this._operations[name] = {priority: priority, variable: variable, apply: apply};
  }

  evaluate(expression: string, context: Partial<Record<string, any>> = {}): any {
    this._context = context;
    const tokens = this.tokenize(expression);
    const rpn = this.convertToRPN(tokens);
    return this.calculateRPN(rpn);
  }
}