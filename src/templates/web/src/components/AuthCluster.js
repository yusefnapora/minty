import * as fcl from "@onflow/fcl";

export default function AuthCluster({ user }) {
  if (user.loggedIn) {
    return (
      <div>
        <span>{user?.addr ?? "No Address"}</span>
        <button
          className="px-3 py-2 mx-2 border rounded-md"
          onClick={fcl.unauthenticate}
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div>
      <button className="px-3 py-2 mx-2 border rounded-md" onClick={fcl.logIn}>
        Log In
      </button>
      <button className="px-3 py-2 mx-2 border rounded-md" onClick={fcl.signUp}>
        Sign Up
      </button>
    </div>
  );
}
