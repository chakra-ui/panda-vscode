/**
 * Deferred promise implementation\
 * Allow resolving a promise later
 *
 * @example
 * ```ts
 *
const deferred = new Deferred();
console.log("waiting 2 seconds...");
setTimeout(() => {
    deferred.resolve("whoa!");
}, 2000);

async function someAsyncFunction() {
    const value = await deferred;
    console.log(value);
}

someAsyncFunction();
// "waiting 2 seconds..."
// "whoa!"
```
 */
export class Deferred<T> {
  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (reason?: any) => void
  public promise: Promise<T>

  public then: Promise<T>['then']
  public catch: Promise<T>['catch']
  public finally: Promise<T>['finally']

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })

    this.then = this.promise.then.bind(this.promise)
    this.catch = this.promise.catch.bind(this.promise)
    this.finally = this.promise.finally.bind(this.promise)
  }

  resolve(value: T | PromiseLike<T>): void {
    this._resolve(value)
  }

  reject(reason?: any): void {
    this._reject(reason)
  }

  get [Symbol.toStringTag](): string {
    return this.constructor.name
  }
}
