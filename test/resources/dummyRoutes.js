const dummyRoutes = [
  {
      "permissions" : [
          "Require user testingdev"
      ],
      "url" : "/",
      "method" : "GET"
  },
  {
      "permissions" : [
          "Require valid-user"
      ],
      "url" : "/log/",
      "method" : "GET"
  },
  {
      "permissions" : [
          "Require all denied"
      ],
      "url" : "/",
      "method" : "POST"
  },
  {
    "permissions" : [
        "Require user literaymachine",
    ],
    "url" : "/literaymachine/",
    "method" : "POST"
  },
  {
      "permissions" : [
          "Require user literaymachine",
          "Require user testuser"
      ],
      "url" : "/test",
      "method" : "POST"
  }
]

module.exports = dummyRoutes