function deferred(importer, recover) {
  let promise
  let loaded
  let failed = false
  let retryAvailable = true
  return {
    get: () => loaded,
    canRetry: () => retryAvailable,
    load() {
      if (!promise) {
        promise = (failed ? recover() : importer()).then((module) => {
          loaded = module.default
          return loaded
        }, (error) => {
          promise = undefined
          if (failed) retryAvailable = false
          failed = true
          throw error
        })
      }
      return promise
    },
  }
}

export const readerView = deferred(() => import('../components/StoryReader.jsx'), () => import('../components/StoryReader.jsx?recovery'))
export const recapView = deferred(() => import('../components/RecapView.jsx'), () => import('../components/RecapView.jsx?recovery'))
export const quizView = deferred(() => import('../components/QuizView.jsx'), () => import('../components/QuizView.jsx?recovery'))
export const savedView = deferred(() => import('../components/SavedPage.jsx'), () => import('../components/SavedPage.jsx?recovery'))
export const youView = deferred(() => import('../components/YouView.jsx'), () => import('../components/YouView.jsx?recovery'))
export const forYouView = deferred(() => import('../components/ForYou.jsx'), () => import('../components/ForYou.jsx?recovery'))
