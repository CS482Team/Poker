const [profile, setProfile] = useState<MyProfile | null>(null)
const [editing, setEditing] = useState<"avatar" | "username" | "email" | null>(null)
const [error, setError] = useState<string | null>(null)

useEffect(() => { fetchMyProfile().then(setProfile).catch((err: Error) => setError(err.message)) }, [])

async function saveUsername(username: string) {
  try {
    await changeUsername(username)
    setProfile({ ...profile!, username: username.trim() })
    setEditing(null)
  } catch (err) {
    setError((err as Error).message)
  }
}