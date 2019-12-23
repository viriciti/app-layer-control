module.exports = (db, names) ->
    db
        .Group
        .find label: $in: names.toArray()
        .select "_id"
        .lean()