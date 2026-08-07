"use strict";
const candidateId = "1aeb38dc-5bbb-4d0b-bf96-060078467a2e"; // Hardcoded from check-db
async function run() {
    const res = await fetch("http://127.0.0.1:5000/api/assessment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId })
    });
    console.log(res.status, await res.text());
}
run();
