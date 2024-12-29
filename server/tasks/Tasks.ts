// Copyright (C) Konrad Gadzinowski

export class Tasks {

  private static timers = {}

  public static stopJob(key: string) {
    if (Tasks.timers[key]) {
      clearInterval(Tasks.timers[key])
      Tasks.timers[key] = null
    }
  }

  public static startJob(key: string, job: () => void, intervalMs: number) {
    Tasks.stopJob(key)
    Tasks.timers[key] = setInterval(() => {
      job()
    }, intervalMs)
    job()
  }
}