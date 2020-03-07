export async function yields(delay: number = 0): Promise<void> {
  return await new Promise<void>((resolve => setTimeout(resolve, delay)));
}