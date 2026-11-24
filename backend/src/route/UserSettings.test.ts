import request from "supertest"
import { app } from "../app"
import { emailAttempts } from "../controller/UserController"
import { checkPassword, getEmail, setEmail } from "../dao/AuthDAO"
import { getProfile, getUserIdFromToken, setAvatarUrl, setUsername } from "../dao/UserDAO"
import { getMyBadges } from "../services/BadgeService"
 
jest.mock("../dao/UserDAO", () => ({
  getUserIdFromToken: jest.fn(),
  getProfile: jest.fn(),
  setUsername: jest.fn(),
  setAvatarUrl: jest.fn(),
 }))

jest.mock("../dao/AuthDAO", () => ({ getEmail: jest.fn(), setEmail: jest.fn(), checkPassword: jest.fn() }))
jest.mock("../services/BadgeService", () => ({ getMyBadges: jest.fn(), awardClosedPeriods: jest.fn() }))

const PNG = "data:image/png;base64,iVBORw0KGgo="

beforeEach(() => {
  jest.resetAllMocks()
  emailAttempts.forget("u1")
  jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
 })

function signedIn(req: request.Test) {
  return req.set("Authorization", "Bearer token")
}
 
describe("GET /users/me", () => {
  it("needs a signed in player", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue(null)
    expect((await signedIn(request(app).get("/users/me"))).status).toBe(401)
  })

  it("returns the profile with the sign-in email", async () => {
    jest.mocked(getProfile).mockResolvedValue({ id: "u1", username: "Maya", avatarUrl: null, email: "", isGuest: false })
    jest.mocked(getEmail).mockResolvedValue("maya@test.local")
    const res = await signedIn(request(app).get("/users/me"))
    expect(res.body).toMatchObject({ username: "Maya", email: "maya@test.local" })
  })

  it("includes the player's leaderboard badges", async () => {
    const badge = { timeframe: "week", place: 1, periodStart: "2026-11-16T00:00:00.000Z", title: "Weekly Champion", period: "Week of Nov 16, 2026" } as const
    jest.mocked(getProfile).mockResolvedValue({ id: "u1", username: "Maya", avatarUrl: null, email: "", isGuest: false })
    jest.mocked(getMyBadges).mockResolvedValue([badge])
    const res = await signedIn(request(app).get("/users/me"))
    expect(res.body.badges).toEqual([badge])
    expect(getMyBadges).toHaveBeenCalledWith("u1")
  })
})

describe("PATCH /users/me/username", () => {
  it("saves a valid username", async () => {
    jest.mocked(setUsername).mockResolvedValue(true)
    const res = await signedIn(request(app).patch("/users/me/username")).send({ username: "  Maya  " })
    expect(res.status).toBe(204)
    expect(setUsername).toHaveBeenCalledWith("u1", "Maya")
  })
 
  it("rejects one that's too short or too long", async () => {
    expect((await signedIn(request(app).patch("/users/me/username")).send({ username: "ab" })).status).toBe(400)
    expect((await signedIn(request(app).patch("/users/me/username")).send({ username: "a".repeat(21) })).status).toBe(400)
    expect(setUsername).not.toHaveBeenCalled()
  })

  it("says when it's taken", async () => {
    jest.mocked(setUsername).mockResolvedValue(false)
    expect((await signedIn(request(app).patch("/users/me/username")).send({ username: "Maya" })).status).toBe(409)
  })
})

describe("PATCH /users/me/avatar", () => {
  it("saves an uploaded picture (ImagePicker sends a data: URL)", async () => {
    const res = await signedIn(request(app).patch("/users/me/avatar")).send({ avatarUrl: PNG })
    expect(res.status).toBe(204)
    expect(setAvatarUrl).toHaveBeenCalledWith("u1", PNG)
  })

  it("saves a web link", async () => {
    expect((await signedIn(request(app).patch("/users/me/avatar")).send({ avatarUrl: "https://example.com/me.png" })).status).toBe(204)
  })

  it("clears it with null", async () => {
    await signedIn(request(app).patch("/users/me/avatar")).send({ avatarUrl: null })
    expect(setAvatarUrl).toHaveBeenCalledWith("u1", null)
  })

  it("rejects anything that isn't an image or a web link", async () => {
    for (const avatarUrl of ["javascript:alert(1)", "data:text/html;base64,PGgxPg==", "not a url", 42]) {
      expect((await signedIn(request(app).patch("/users/me/avatar")).send({ avatarUrl })).status).toBe(400)
    }
    expect(setAvatarUrl).not.toHaveBeenCalled()
  })

  it("rejects a picture that's too big", async () => {
    const huge = "data:image/png;base64," + "A".repeat(1_500_000)
    expect((await signedIn(request(app).patch("/users/me/avatar")).send({ avatarUrl: huge })).status).toBe(400)
  })
})

describe("PATCH /users/me/email", () => {
  it("changes the email after checking the current password", async () => {
    jest.mocked(getEmail).mockResolvedValue("old@test.local")
    jest.mocked(checkPassword).mockResolvedValue(true)
    jest.mocked(setEmail).mockResolvedValue(true)
    const res = await signedIn(request(app).patch("/users/me/email")).send({ password: "secret1", email: " New@Test.local " })
    expect(res.status).toBe(204)
    expect(checkPassword).toHaveBeenCalledWith("old@test.local", "secret1")
    expect(setEmail).toHaveBeenCalledWith("u1", "new@test.local")
  })

  it("rejects a wrong password", async () => {
    jest.mocked(getEmail).mockResolvedValue("old@test.local")
    jest.mocked(checkPassword).mockResolvedValue(false)
    expect((await signedIn(request(app).patch("/users/me/email")).send({ password: "wrong", email: "new@test.local" })).status).toBe(403)
    expect(setEmail).not.toHaveBeenCalled()
  })

  it("says when another account has that email", async () => {
    jest.mocked(getEmail).mockResolvedValue("old@test.local")
    jest.mocked(checkPassword).mockResolvedValue(true)
    jest.mocked(setEmail).mockResolvedValue(false)
    expect((await signedIn(request(app).patch("/users/me/email")).send({ password: "secret1", email: "taken@test.local" })).status).toBe(409)
  })

  it("tells guests they have no email to change", async () => {
    jest.mocked(getEmail).mockResolvedValue(null)
    const res = await signedIn(request(app).patch("/users/me/email")).send({ password: "x", email: "new@test.local" })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/guest/i)
  })

  it("limits password guesses", async () => {
    jest.mocked(getEmail).mockResolvedValue("old@test.local")
    jest.mocked(checkPassword).mockResolvedValue(false)
    for (let i = 0; i < 5; i++) await signedIn(request(app).patch("/users/me/email")).send({ password: "guess", email: "new@test.local" })
    const res = await signedIn(request(app).patch("/users/me/email")).send({ password: "guess", email: "new@test.local" })
    expect(res.status).toBe(429)
    expect(checkPassword).toHaveBeenCalledTimes(5)
  })

  it("rejects a missing password or email", async () => {
    expect((await signedIn(request(app).patch("/users/me/email")).send({ email: "new@test.local" })).status).toBe(400)
    expect((await signedIn(request(app).patch("/users/me/email")).send({ password: "x", email: "nope" })).status).toBe(400)
  })
})
