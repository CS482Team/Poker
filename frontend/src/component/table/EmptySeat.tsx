/* An open seat, so seats keep their place at the table as players join and leave */
export default function EmptySeat() {
  return (
    <div className="text-center">
      <div className="seat-portrait empty" role="img" aria-label="Open seat" />
      <div className="seat-label invisible" aria-hidden>
        &nbsp;
      </div>
    </div>
  )
}
