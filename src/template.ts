export class Template {

  private readonly context: Partial<Record<string, any>> = {};

  add(key: string, value: any): void {
    this.context[key] = value;
  }

  render(template: string): string {
    return template.replace(
      /{{([^}]+)}}/g,
      (_match: string, token: string) => {
        let sub = token.split('.');
        if (sub.length >= 1) {
          let value: any = this.context;
          while (sub.length > 0) {
            const [next] = sub.splice(0, 1);
            value = value[next];
          }
          return value || null;
        }
        return token;
      });
  }
}