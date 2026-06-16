# Vault Agent template → .env.runtime for docker compose
# Used with: vault agent -config=agent.hcl

{{- with secret "secret/data/watchify/prod" }}
JWT_SECRET={{ .Data.data.jwt_secret }}
USER_MONGO_URI={{ .Data.data.user_mongo_uri }}
UPLOAD_MONGO_URI={{ .Data.data.upload_mongo_uri }}
WATCH_MONGO_URI={{ .Data.data.watch_mongo_uri }}
AWS_ACCESS_KEY_ID={{ .Data.data.aws_access_key_id }}
AWS_SECRET_ACCESS_KEY={{ .Data.data.aws_secret_access_key }}
{{- end }}
JWT_EXPIRES_IN=7d
FRONTEND_PORT=80
UPLOAD_PORT=3002
