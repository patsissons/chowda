import { ImageResponse } from 'next/og'

export const alt = 'Chowda for Lobsters preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-static'

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '54px',
        background:
          'radial-gradient(circle at 10% 15%, rgba(172, 19, 13, 0.26), transparent 45%), radial-gradient(circle at 90% 88%, rgba(152, 0, 0, 0.2), transparent 45%)',
        backgroundColor: '#161311',
        color: '#f7eee8',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            fontSize: 24,
            color: '#e7ccc0',
            border: '1px solid rgba(231, 204, 192, 0.4)',
            borderRadius: 999,
            padding: '8px 16px',
          }}
        >
          CHOWDA
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 68,
            lineHeight: 1.05,
            maxWidth: '940px',
            letterSpacing: '-0.02em',
          }}
        >
          Minimal Lobsters companion for calm reading
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 30, color: '#d8c3b9' }}>
          Clean feed context. Better discovery. Future-ready utilities.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 14,
            background: '#ac130d',
            color: '#fff',
            fontSize: 28,
            fontWeight: 700,
            padding: '16px 26px',
            whiteSpace: 'nowrap',
          }}
        >
          Open the app
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
