import { Warp } from "@paper-design/shaders-react"
import { useEffect, useState } from "react"

export default function WarpShaderHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-cyan-900 via-teal-800 to-cyan-900">
      {mounted && (
        <Warp
          style={{
            height: "100%",
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0
          }}
          proportion={0.45}
          softness={1}
          distortion={0.25}
          swirl={0.8}
          swirlIterations={10}
          shape="checks"
          shapeScale={0.1}
          scale={1}
          rotation={0}
          speed={1}
          colors={["hsl(200, 100%, 20%)", "hsl(160, 100%, 75%)", "hsl(180, 90%, 30%)", "hsl(170, 100%, 80%)"]}
        />
      )}
    </div>
  )
}
