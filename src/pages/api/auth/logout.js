import cookie from "cookie";

export default function handler(req, res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
      path: "/",
      expires: new Date(0), // expire immediately
    })
  );

  return res.status(200).json({ success: true, message: "Logged out" });
}
