

import { json } from "../lib/helpers/api-helpers";



export async function handler(event) {
  console.log(event)
  try {
    if (event.httpMethod === "GET") {
      return json(200, {message:'Success', parameters: event.multiValueQueryStringParameters});
    }

    if (event.httpMethod === "POST") {
      return json(201, {message:'Created POST called'});
    }

  } catch (e) {
    return json(500, { message: "server error", error: String(e) });
}

}