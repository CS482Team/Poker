{DAILY_REWARDS.map((chips, i) => {
  const day = i + 1
  const available = status.canClaim && day === status.day
  return (
    <button key={day} type="button" disabled={!available} onClick={claim} aria-label={`Day ${day}: $${chips}`}>
      <span>Day {day}</span>
      <b>${chips.toLocaleString()}</b>
      {!available && <Icon d={LOCK} size={14} />}
    </button>
  )
})}
{!status.canClaim && <p>Next reward in {timeUntil(status.nextClaimAt)}</p>}