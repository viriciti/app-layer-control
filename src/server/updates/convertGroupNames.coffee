module.exports = (db, names) ->
    db
        .Group
        .find label: $in: names
        .select "_id"
        .lean()