# food-blog-api

This is an api created speficialy for food-blog project

# Authentication

Api can be launched either with authentication or without. This is controlled by `AUTH_ENABLED` variable in `.ENV` file.

If enabled then on `/api/public` routes either `USER_API_KEY` or `ADMIN_API_KEY` from `.ENV` will be checked on each request by header (`Authorization: Bearer providedKey`).

On `/api/admin` routes only `ADMIN_API_KEY` will be checked.

# Posts routes

## GET /api/public/posts

Gets all posts with content excluded

Response example:

```
[
    {
        "_id": "63df7d00d336457c856d48ec",
        "title": "First post edited",
        "categoryId": "63df89470f48be4e28734634",
        "createdAt": 1675590912997,
        "updatedAt": 1675595143127
    }
]
```

## GET /api/public/posts/:id

Gets post object by id. `404` returned if not found.

Response example:

```
{
    "_id": "63df7d00d336457c856d48ec",
    "title": "First post edited",
    "imageUrl": "https://www.biggerbolderbaking.com/wp-content/uploads/2021/02/New-York-Style-Pizza-Thumbnail1-scaled.jpg",
    "content": "<p>Some content</p>",
    "categoryId": "63df89470f48be4e28734634",
    "rating": 1.5,
    "ratingCount": 2,
    "createdAt": 1675590912997,
    "updatedAt": 1675595143127
}
```

## POST /api/admin/posts

Saves new post. Responds with `204` on success. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "title": "First post",
    "imageUrl": "https://www.biggerbolderbaking.com/wp-content/uploads/2021/02/New-York-Style-Pizza-Thumbnail1-scaled.jpg",
    "content": "<p>Some content</p>",
    "categoryId": "63df89470f48be4e28734634"
}
```

## PUT /api/admin/posts/:id

Updates existing post. Responds with `204` on success. Responds with `404` if post does not exist. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "title": "First post",
    "imageUrl": "https://www.biggerbolderbaking.com/wp-content/uploads/2021/02/New-York-Style-Pizza-Thumbnail1-scaled.jpg",
    "content": "<p>Some content</p>",
    "categoryId": "63df89470f48be4e28734634"
}
```

## PUT /api/public/posts-rate/:postId

Updates post rating average. Responds with `204` on success. Responds with `404` if post does not exist. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "rating": 2
}
```

## DELETE /api/admin/posts/:id

Deletes post. Responds with `204` on success. Responds with `404` if post does not exist.

# Categories routes

## GET /api/public/categories

Gets all categories

Response example:

```
[
    {
        "_id": "63df89470f48be4e28734634",
        "title": "First category",
        "createdAt": 1675594055518,
        "updatedAt": 1675594055518
    }
]
```

## GET /api/public/categories/:id

Gets category object by id. `404` returned if not found.

Response example:

```
{
    "_id": "63df89470f48be4e28734634",
    "title": "First category",
    "createdAt": 1675594055518,
    "updatedAt": 1675594055518
}
```

## GET /api/public/categories-posts/:categoryId

Gets all posts for a given category id.

Response example:

```
[
    {
        "_id": "63df7d00d336457c856d48ec",
        "title": "First post edited",
        "categoryId": "63df89470f48be4e28734634",
        "createdAt": 1675590912997,
        "updatedAt": 1675595143127
    }
]
```

## POST /api/admin/categories

Saves new category. Responds with `204` on success. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "title": "First category"
}
```

## PUT /api/admin/categories/:id

Updates existing category. Responds with `204` on success. Responds with `404` if category does not exist. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "title": "First category edited"
}
```

## DELETE /api/admin/posts/:id

NOT IMPLEMENTED.

Cannot safely implement this since deleting category would leave posts with no category.

# Comments routes

## GET /api/public/comments

Gets all comments

Response example:

```
[
    {
        "_id": "63df9407a69c52f07dd1e76e",
        "postId": "63df7d00d336457c856d48ec",
        "userName": "testUser",
        "content": "Im amazed by this post",
        "createdAt": 1675596807685,
        "updatedAt": 1675596807685
    }
]
```

## GET /api/public/comments/:id

Gets comment object by id. `404` returned if not found.

Response example:

```
{
    "_id": "63df9407a69c52f07dd1e76e",
    "postId": "63df7d00d336457c856d48ec",
    "userName": "testUser",
    "content": "Im amazed by this post",
    "createdAt": 1675596807685,
    "updatedAt": 1675596807685
}
```

## GET /api/public/post-comments/:postId

Gets all comments by postId

Response example:

```
[
    {
        "_id": "63df9407a69c52f07dd1e76e",
        "postId": "63df7d00d336457c856d48ec",
        "userName": "testUser",
        "content": "Im amazed by this post",
        "createdAt": 1675596807685,
        "updatedAt": 1675596807685
    }
]
```

## POST /api/admin/comments

Saves new comment. Responds with `204` on success. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "postId": "63df7d00d336457c856d48ec",
    "userName": "testUser",
    "content": "Im amazed by this post"
}
```

## PUT /api/admin/comments/:id

Updates existing comment. Responds with `204` on success. Responds with `404` if comment does not exist. Responds with `400` and validation text returned if wrong data.

Request example:

```
{
    "content": "Im amazed by this post. EDITED"
}
```

## DELETE /api/admin/comments/:id

Deletes comment. Responds with `204` on success. Responds with `404` if comment does not exist.

