/* An open seat, so seats keep their place at the table as players join and leave */
export default function EmptySeat() {
  return (
    <div className="text-center">
      <div className="seat-portrait empty" aria-hidden />
      <div className="seat-label">
        <span className="open">Open seat</span>
      </div>
    </div>
  )
}
