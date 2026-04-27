export class SessionStoreConnection {

  public static async close(sessionStore: any): Promise<void> {
    const closeMethod = sessionStore?.close
    if (typeof closeMethod !== 'function') {
      return
    }

    if (closeMethod.length > 0) {
      // Handle callback
      await new Promise<void>((resolve, reject) => {
        closeMethod((error: any) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
      return
    }

    await closeMethod()
  }
}
