import { useState, useEffect } from 'react'

export function useAnimatedValue(target, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let timeoutId
    let animationFrameId

    const startAnimation = () => {
      const startTime = Date.now()
      const startValue = 0

      const animate = () => {
        const elapsedTime = Date.now() - startTime

        if (elapsedTime >= duration) {
          setValue(target)
          return
        }

        // Easing function: easeOutQuad
        const progress = elapsedTime / duration
        const easeProgress = 1 - Math.pow(1 - progress, 2)
        const currentValue = startValue + (target - startValue) * easeProgress

        setValue(currentValue)
        animationFrameId = requestAnimationFrame(animate)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay)
    } else {
      startAnimation()
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [target, duration, delay])

  return value
}
