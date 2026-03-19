import { useState } from 'react'

export function useSwipe(
  onSwipeLeft = null,
  onSwipeRight = null,
  onSwipeUp = null,
  onSwipeDown = null,
  threshold = 50
) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [swipeDirection, setSwipeDirection] = useState(null)
  const [swiping, setSwiping] = useState(false)

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
    setSwiping(false)
  }

  const handleTouchEnd = (e) => {
    if (!touchStart.x || !touchStart.y) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const diffX = touchStart.x - touchEnd.x
    const diffY = touchStart.y - touchEnd.y

    const absDiffX = Math.abs(diffX)
    const absDiffY = Math.abs(diffY)

    // Determine if swipe is more horizontal or vertical
    if (absDiffX > absDiffY) {
      // Horizontal swipe
      if (absDiffX > threshold) {
        setSwiping(true)
        if (diffX > 0) {
          // Swipe left
          setSwipeDirection('left')
          if (onSwipeLeft) onSwipeLeft()
        } else {
          // Swipe right
          setSwipeDirection('right')
          if (onSwipeRight) onSwipeRight()
        }
      }
    } else {
      // Vertical swipe
      if (absDiffY > threshold) {
        setSwiping(true)
        if (diffY > 0) {
          // Swipe up
          setSwipeDirection('up')
          if (onSwipeUp) onSwipeUp()
        } else {
          // Swipe down
          setSwipeDirection('down')
          if (onSwipeDown) onSwipeDown()
        }
      }
    }

    // Reset after a brief delay
    setTimeout(() => {
      setSwiping(false)
      setSwipeDirection(null)
    }, 300)
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    swipeDirection,
    swiping
  }
}
