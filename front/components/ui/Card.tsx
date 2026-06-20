export default function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      {children}
    </div>
  )
}
