'use client'
import { useState } from "react"
interface RangeSliderProps {
    min?: number
    max?: number
    step?: number
    defaultValue?: number
    label?: string
    onChange?: (value: number) => void
  }
  
 export default function RangeSlider({
    min = 0,
    max = 100,
    step = 1,
    defaultValue = 50,
    label = 'Range Slider',
    onChange
  }: RangeSliderProps) {
    const [value, setValue] = useState(defaultValue)
  
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(event.target.value)
      setValue(newValue)
      if (onChange) {
        onChange(newValue)
      }
    }
  
    const percentage = ((value - min) / (max - min)) * 100
  
    return (
      <div className="w-full max-w-md mx-auto">
        <label htmlFor="range-slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type="range"
            id="range-slider"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
            }}
          />
          <div 
            className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
            style={{ left: `${percentage}%` }}
          >
            {value}
          </div>
        </div>
      </div>
    )
  }
  