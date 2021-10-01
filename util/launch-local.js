const exec = require("child_process").exec;
const child = exec("./launch-local.sh");
child.stdout.on("data", (data) => {
  console.log(`${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`${data}`);
});
