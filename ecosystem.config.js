module.exports = {
    apps: [
      {
        name: "next-frontend",
        script: "npm",
        args: "start", // runs `next start`
        instances: 1, // you can set to "max" to use all CPU cores
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "production",
          PORT: 3000,
          NEXT_PUBLIC_SRS_SERVER: "https://api.studentrevelationsystem.com",
          NEXT_PUBLIC_AWS_SERVER: "https://api.studentrevelationsystem.com",
          SRS_SERVER: "https://api.studentrevelationsystem.com"
        },
        env_staging: {
          NODE_ENV: "production",
          PORT: 3000,
          NEXT_PUBLIC_SRS_SERVER: "https://api-staging.studentrevelationsystem.com",
          NEXT_PUBLIC_AWS_SERVER: "https://api-staging.studentrevelationsystem.com",
          SRS_SERVER: "https://api-staging.studentrevelationsystem.com"
        },
        env_production: {
          NODE_ENV: "production",
          PORT: 3000,
          NEXT_PUBLIC_SRS_SERVER: "https://api.studentrevelationsystem.com",
          NEXT_PUBLIC_AWS_SERVER: "https://api.studentrevelationsystem.com",
          SRS_SERVER: "https://api.studentrevelationsystem.com"
        }
      }
    ]
  };