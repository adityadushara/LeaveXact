"use client"

import { useRef, useState, useEffect, ReactNode } from "react"

interface CustomScrollbarProps {
  children: ReactNode
  maxHeight?: string
  className?: string
}

export function CustomScrollbar({ children, maxHeight = "110px", className = "" }: CustomScrollbarProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  const scrollThumbRef = useRef<HTMLDivElement>(null)
  const [thumbHeight, setThumbHeight] = useState(20)
  const [scrollStartPosition, setScrollStartPosition] = useState<number | null>(null)
  const [initialScrollTop, setInitialScrollTop] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isScrollable, setIsScrollable] = useState(false)

  function handleResize() {
    if (contentRef.current && scrollTrackRef.current) {
      const { clientHeight, scrollHeight } = contentRef.current
      const thumbHeightPercentage = (clientHeight / scrollHeight) * 100
      setThumbHeight(Math.max((thumbHeightPercentage * clientHeight) / 100, 20))
      // Only show scrollbar if content is actually scrollable
      setIsScrollable(scrollHeight > clientHeight)
    }
  }

  function handleThumbPosition() {
    if (!contentRef.current || !scrollTrackRef.current || !scrollThumbRef.current) {
      return
    }
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current
    const trackHeight = scrollTrackRef.current.clientHeight
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight)
    const newTop = Math.min(scrollPercentage * (trackHeight - thumbHeight), trackHeight - thumbHeight)
    scrollThumbRef.current.style.top = `${Math.max(0, newTop)}px`
  }

  function handleThumbMousedown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setScrollStartPosition(e.clientY)
    if (contentRef.current) setInitialScrollTop(contentRef.current.scrollTop)
    setIsDragging(true)
  }

  function handleThumbMouseup(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isDragging) {
      setIsDragging(false)
    }
  }

  function handleThumbMousemove(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isDragging && contentRef.current && scrollTrackRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current
      const trackHeight = scrollTrackRef.current.clientHeight
      const deltaY = (e.clientY - (scrollStartPosition || 0)) * ((scrollHeight - clientHeight) / (trackHeight - thumbHeight))
      contentRef.current.scrollTop = initialScrollTop + deltaY
    }
  }

  function handleTrackClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (contentRef.current && scrollTrackRef.current && scrollThumbRef.current) {
      const { clientY } = e
      const target = e.target as HTMLDivElement
      const rect = target.getBoundingClientRect()
      const thumbOffset = -(thumbHeight / 2)
      const clickPosition = clientY - rect.top + thumbOffset
      const { scrollHeight, clientHeight } = contentRef.current
      const trackHeight = scrollTrackRef.current.clientHeight
      const scrollAmount = (clickPosition / trackHeight) * (scrollHeight - clientHeight)
      contentRef.current.scrollTop = scrollAmount
    }
  }

  useEffect(() => {
    if (contentRef.current) {
      const ref = contentRef.current
      const resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(ref)
      ref.addEventListener("scroll", handleThumbPosition)
      return () => {
        resizeObserver.unobserve(ref)
        ref.removeEventListener("scroll", handleThumbPosition)
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleThumbMousemove)
    document.addEventListener("mouseup", handleThumbMouseup)
    return () => {
      document.removeEventListener("mousemove", handleThumbMousemove)
      document.removeEventListener("mouseup", handleThumbMouseup)
    }
  }, [isDragging, scrollStartPosition, initialScrollTop])

  useEffect(() => {
    handleResize()
    handleThumbPosition()
  }, [children])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={contentRef}
        className={`overflow-y-auto overflow-x-hidden custom-scrollbar-hidden ${isScrollable ? 'pr-3' : 'pr-0'}`}
        style={{ maxHeight }}
      >
        {children}
      </div>
      {isScrollable && (
        <div
          ref={scrollTrackRef}
          className="absolute top-0 right-0 w-[5px] h-full bg-transparent rounded-full overflow-hidden"
          onClick={handleTrackClick}
        >
          <div
            ref={scrollThumbRef}
            className="absolute top-0 right-0 w-[5px] bg-emerald-500/30 hover:bg-emerald-500/50 rounded-full cursor-pointer transition-colors will-change-transform"
            style={{ height: `${thumbHeight}px`, maxHeight: '100%' }}
            onMouseDown={handleThumbMousedown}
          />
        </div>
      )}
    </div>
  )
}
