export class SessionStoreConnection {

  public static async close(sessionStore: any): Promise<void> {
    if (typeof sessionStore?.close !== 'function') {
      return
    }

    if (sessionStore.close.length > 0) {
      await new Promise<void>((resolve, reject) => {
        sessionStore.close((error: any) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
      return
    }

    await sessionStore.close()
  }
}
