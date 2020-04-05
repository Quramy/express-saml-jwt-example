const accessToken = sessionStorage.getItem("apiToken");

document.getElementById("token").innerText = `API token: ${accessToken ? accessToken : "no token"}`;

document.getElementById("auth_btn").addEventListener("click", () => {
  location.href = "/auth/login";
});

document.getElementById("api").addEventListener("click", async () => {
  const apiToken = sessionStorage.getItem("apiToken");
  if (!apiToken) {
    document.getElementById("api_results").innerText += "no token. Pls login." + "\n";
    return;
  }
  const res = await fetch("/api/test", {
    headers: {
      "Authorization": `Bearer ${apiToken}`,
    }
  });
  const json = await res.json();
  document.getElementById("api_results").innerText += JSON.stringify(json) + "\n";
});

document.getElementById("invalidate_token").addEventListener("click", () => {
  delete sessionStorage["apiToken"];
  location.reload();
});
