export function json(status, body, header={}){
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...header },
    body: JSON.stringify(body)

  }
}

