import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// If later needed: import AzureAD from "next-auth/providers/azure-ad";

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  }),
];

const handler = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const url = new URL("/api/auth/upsert_user/", base);
        const res = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": process.env.BACKEND_API_KEY || "dev-frontend-sync",
          },
          body: JSON.stringify({
            email: user?.email,
            name: user?.name,
            provider: account?.provider,
            provider_account_id: (account as any)?.providerAccountId,
          }),
        });
        if (!res.ok) {
          console.warn("upsert_user failed", await res.text());
        }
      } catch (e) {
        console.warn("upsert_user error", e);
      }
      return true;
    },
  },
});

export { handler as GET, handler as POST };
