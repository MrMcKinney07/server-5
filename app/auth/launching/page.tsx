"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Rocket, Star, Sparkles, Zap } from "lucide-react"

interface Firework {
  id: number
  x: number
  y: number
  color: string
  particles: { angle: number; speed: number; size: number }[]
}

const FIREWORK_COLORS = [
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-purple-600",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-amber-500",
  "from-pink-400 to-rose-600",
  "from-emerald-400 to-green-500",
]

export default function LaunchingPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [fireworks, setFireworks] = useState<Firework[]>([])
  const [showFinale, setShowFinale] = useState(false)

  const createFirework = useCallback(() => {
    const particles = Array.from({ length: 12 }, () => ({
      angle: Math.random() * 360,
      speed: Math.random() * 100 + 50,
      size: Math.random() * 4 + 2,
    }))

    const newFirework: Firework = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 50 + 10,
      color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
      particles,
    }

    setFireworks((prev) => [...prev, newFirework])

    setTimeout(() => {
      setFireworks((prev) => prev.filter((f) => f.id !== newFirework.id))
    }, 1500)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 100)

    const fireworkInterval = setInterval(() => {
      createFirework()
    }, 400)

    const finaleTimeout = setTimeout(() => {
      setShowFinale(true)
      const finaleInterval = setInterval(() => {
        createFirework()
        createFirework()
      }, 150)
      setTimeout(() => clearInterval(finaleInterval), 2000)
    }, 4000)

    const timeout = setTimeout(() => {
      router.push("/dashboard")
    }, 5000)

    return () => {
      clearInterval(interval)
      clearInterval(fireworkInterval)
      clearTimeout(finaleTimeout)
      clearTimeout(timeout)
    }
  }, [router, createFirework])

  return (
    <div
      className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative"
      style={{ perspective: "1000px" }}
    >
      <div className="absolute inset-0 pointer-events-none z-50">
        <div
          className="absolute text-9xl"
          style={{
            animation: "eagleFly 3s ease-in-out forwards",
            filter: "drop-shadow(0 0 30px rgba(251, 191, 36, 0.6))",
          }}
        >
          🦅
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-20">
        {fireworks.map((firework) => (
          <div
            key={firework.id}
            className="absolute"
            style={{
              left: `${firework.x}%`,
              top: `${firework.y}%`,
            }}
          >
            <div
              className={`absolute w-1 h-16 bg-gradient-to-t ${firework.color} opacity-60 rounded-full`}
              style={{
                animation: "fireworkLaunch 0.3s ease-out forwards",
                transformOrigin: "bottom center",
              }}
            />
            {firework.particles.map((particle, i) => (
              <div
                key={i}
                className={`absolute rounded-full bg-gradient-to-r ${firework.color}`}
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animation: `fireworkExplode 1.2s ease-out 0.3s forwards`,
                  transform: `rotate(${particle.angle}deg)`,
                  boxShadow: `0 0 ${particle.size * 2}px currentColor`,
                  ["--travel-x" as string]: `${Math.cos((particle.angle * Math.PI) / 180) * particle.speed}px`,
                  ["--travel-y" as string]: `${Math.sin((particle.angle * Math.PI) / 180) * particle.speed}px`,
                }}
              />
            ))}
            <div
              className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${firework.color} blur-md`}
              style={{
                animation: "fireworkGlow 0.6s ease-out 0.3s forwards",
              }}
            />
          </div>
        ))}

        {showFinale &&
          Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-5%",
                animation: `sparkleRain ${Math.random() * 2 + 1}s linear ${Math.random() * 0.5}s forwards`,
                boxShadow: "0 0 4px white, 0 0 8px white",
              }}
            />
          ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end gap-1 h-32 opacity-60">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`bar-${i}`}
            className="w-2 bg-gradient-to-t from-cyan-500 via-blue-500 to-violet-500 rounded-t"
            style={{
              animation: `visualizer 0.3s ease-in-out ${i * 0.05}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-black to-slate-950" />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/20 rounded-full"
          style={{
            animation: "spin3d 8s linear infinite",
            transform: "rotateX(75deg) rotateY(0deg)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/30 rounded-full"
          style={{
            animation: "spin3d 6s linear infinite reverse",
            transform: "rotateX(75deg) rotateY(45deg)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-violet-500/40 rounded-full"
          style={{
            animation: "spin3d 4s linear infinite",
            transform: "rotateX(75deg) rotateY(90deg)",
          }}
        />

        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 blur-xl opacity-60"
          style={{ animation: "float3d 3s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 blur-xl opacity-50"
          style={{ animation: "float3d 2.5s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 blur-lg opacity-40"
          style={{ animation: "float3d 2s ease-in-out infinite" }}
        />

        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 2 + 1}s ease-in-out ${Math.random() * 2}s infinite`,
              transform: `translateZ(${Math.random() * 100}px)`,
            }}
          />
        ))}

        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `flyToCenter 2s ease-in ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 text-center px-6"
        style={{
          transformStyle: "preserve-3d",
          animation: "emergeIn 0.8s ease-out forwards",
        }}
      >
        <div className="mb-8 relative" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.5),0_0_100px_rgba(59,130,246,0.3)]"
            style={{
              animation: "rocketPulse 0.5s ease-in-out infinite alternate",
              transform: "rotateX(-10deg) rotateY(10deg)",
            }}
          >
            <Rocket
              className="w-16 h-16 text-white drop-shadow-2xl"
              style={{ animation: "rocketShake 0.1s ease-in-out infinite" }}
            />
          </div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div
              className="w-12 h-24 bg-gradient-to-b from-orange-500 via-orange-400 to-yellow-300 blur-md opacity-80"
              style={{ animation: "exhaustFlicker 0.1s ease-in-out infinite" }}
            />
            <div
              className="w-8 h-32 bg-gradient-to-b from-orange-400/60 via-red-500/40 to-transparent blur-lg"
              style={{ animation: "exhaustFlicker 0.15s ease-in-out infinite" }}
            />
          </div>

          <div
            className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: "orbit 2s linear infinite" }}
          >
            <Star className="absolute -top-2 left-1/2 w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          </div>
          <div
            className="absolute top-1/2 left-1/2 w-56 h-56 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: "orbit 3s linear infinite reverse" }}
          >
            <Sparkles className="absolute -top-2 left-1/2 w-5 h-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: "orbit 2.5s linear infinite" }}
          >
            <Zap className="absolute -top-2 left-1/2 w-4 h-4 text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
          </div>
        </div>

        <h1
          className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          style={{
            textShadow: "0 4px 0 #1e293b, 0 8px 0 #0f172a, 0 0 40px rgba(34,211,238,0.5)",
            animation: "textPulse 1s ease-in-out infinite alternate",
          }}
        >
          GET READY
        </h1>
        <h2
          className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 via-violet-400 to-cyan-400 mb-4"
          style={{
            backgroundSize: "200% auto",
            animation: "gradientShift 1s linear infinite",
            filter: "drop-shadow(0 0 20px rgba(34,211,238,0.5))",
          }}
        >
          FOR GREATNESS
        </h2>
        <p
          className="text-xl md:text-2xl text-cyan-200/80 mb-10 font-medium tracking-wide"
          style={{ animation: "fadeInUp 0.5s ease-out 0.3s forwards", opacity: 0 }}
        >
          Your mission awaits. Time to dominate.
        </p>

        <div className="w-80 mx-auto">
          <div
            className="h-3 bg-slate-900/80 rounded-full overflow-hidden border border-cyan-500/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
            style={{ transform: "perspective(500px) rotateX(20deg)" }}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)]"
              style={{
                width: `${progress}%`,
                transition: "width 100ms linear",
              }}
            />
          </div>
          <p className="text-sm text-cyan-400/60 mt-4 tracking-widest uppercase">Initializing Command Center...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin3d {
          from { transform: rotateX(75deg) rotateZ(0deg); }
          to { transform: rotateX(75deg) rotateZ(360deg); }
        }
        @keyframes float3d {
          0%, 100% { transform: translateY(0) translateZ(0); }
          50% { transform: translateY(-30px) translateZ(50px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes flyToCenter {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0) translate(-50vw, -50vh); }
        }
        @keyframes emergeIn {
          0% { opacity: 0; transform: translateZ(-200px) scale(0.5); }
          100% { opacity: 1; transform: translateZ(0) scale(1); }
        }
        @keyframes rocketPulse {
          0% { transform: rotateX(-10deg) rotateY(10deg) scale(1); }
          100% { transform: rotateX(-10deg) rotateY(10deg) scale(1.05); }
        }
        @keyframes rocketShake {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-2px) translateY(1px); }
          50% { transform: translateX(2px) translateY(-1px); }
          75% { transform: translateX(-1px) translateY(2px); }
        }
        @keyframes exhaustFlicker {
          0%, 100% { opacity: 0.8; transform: scaleY(1) scaleX(1); }
          50% { opacity: 1; transform: scaleY(1.1) scaleX(0.9); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes textPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.02); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes visualizer {
          0% { height: 10%; }
          100% { height: 100%; }
        }
        @keyframes fireworkLaunch {
          0% { transform: scaleY(0); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0; }
        }
        @keyframes fireworkExplode {
          0% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: translate(var(--travel-x), var(--travel-y)) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes fireworkGlow {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(2); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        @keyframes sparkleRain {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes eagleFly {
          0% {
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(0.1) rotateY(0deg) translateZ(-500px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(4) rotateY(15deg) translateZ(300px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
