var app = require("../server/server");
var ds = app.datasources.db;
tables = [
  "AccessToken",
  "ACL",
  "RoleMapping",
  "Role",
  "user",
  "center_details",
  "center_reviews",
  "center_facility",
  "center_programs",
  "center_images",
  "klay_admin_access",
  "corporate_details",
  "corporate_branch"
];
ds.autoupdate(tables, err => {
  if (err) throw err;
  console.log("models created", tables);
  ds.disconnect();
  //process.exit();
});
