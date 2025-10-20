Accepts `location` prop with the format:

```json
[
	[
		{
			"param": "post_type",
			"operator": "==",
			"value": "post"
		},
		{
			"param": "post_type",
			"operator": "==",
			"value": "page"
		}
	],
	[
		{
			"param": "post_status",
			"operator": "==",
			"value": "publish"
		}
	]
]
```

Has an `onChange` prop that gives the adjusted `location` object.
