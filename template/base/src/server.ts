import app from "./app";
import { ENV } from "./config";
/*__DB_IMPORT__*/

const PORT = ENV.PORT || 3000;

/*__DB_CONNECT__*/

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});