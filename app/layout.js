import './globals.css'

export const metadata = {
  title: 'tic tac toe',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
