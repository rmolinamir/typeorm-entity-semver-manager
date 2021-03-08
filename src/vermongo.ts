
// package v7db.files.mongodb;

// import java.util.ArrayList;
// import java.util.List;

// import org.bson.BSONObject;


// import com.mongodb.BasicDBObject;
// import com.mongodb.DBCollection;
// import com.mongodb.DBObject;
// import com.mongodb.WriteConcern;
// import com.mongodb.WriteResult;

import {
  Collection,
  OptionalId,
  WithId,
  CollectionInsertOneOptions,
  InsertOneWriteOpResult,
} from 'mongodb';

// TODO: Validate version number via regexp to match strings such as "1.0.0".

export class Vermongo {
	static _VERSION = '_version';

  private shadowCollection: Collection;

  constructor(args: {
    shadowCollection: Collection;
  }) {
    this.shadowCollection = args.shadowCollection;
  }

	/**
	 * @return an old version of the document with the given id, at the given
	 *         version number
	 */

	static async getOldVersion<T extends object> (
    collection: Collection,
    _id: string,
    versionNumber: string,
  ): Promise<T | null> {
    const result = await collection.findOne({
      _id,
      [Vermongo._VERSION]: versionNumber,
    });

		if (result == null) {
			return null;
    }

		return result as T;
	}

	/**
	 * The list of old versions does not include the current version of the
	 * document, but it does include dummy entries to mark the deletion (if the
	 * document was deleted). The list is ordered by version number.
	 * 
	 * @return the list of old version of the document with the given id
	 */
	static async getOldVersions<T extends object>(
    collection: Collection,
    _id: string,
  ): Promise<Array<T>> {
    const result = await collection.find(
      {
        _id,
      },
      {
        sort: {
          [Vermongo._VERSION]: -1,
        }
      }
    );
  }

	static List<DBObject> getOldVersions(DBCollection c, Object id) {
		DBObject query = QueryUtils.between("_id", new BasicDBObject("_id", id)
				.append("_version", 0), new BasicDBObject("_id", id).append(
				"_version", Integer.MAX_VALUE));

		List<DBObject> result = new ArrayList<DBObject>();
		for (DBObject o : getShadowCollection(c).find(query).sort(
				new BasicDBObject("_id", 1))) {
			o.put("_id", ((BasicDBObject) getId(o)).get("_id"));
			result.add(o);
		}

		return result;
	}

	/**
	 * Inserts a new object into the collection. The `_version` property must not
	 * be present in the object, and will be set to `1` (integer).
	 * 
	 * @param collection
	 * @param docs
	 * @param options
	 */
	public async insertOne<T extends object>(
    collection: Collection,
    docs: OptionalId<T>,
    options?: CollectionInsertOneOptions,
  ): Promise<InsertOneWriteOpResult<WithId<T>>> {
		if (docs[Vermongo._VERSION]) {
			throw new Error('The [_version] property must not be present in the object');
    }

    Object.assign(docs, { [Vermongo._VERSION]: 1 });

		const result = await collection.insertOne(docs, options);

    return result;
	}

	/**
	 * Updates an existing object. The object must have the `_version` property set to
   * the version number of the base revision (i.e. the version number to be replaced).
   * If the current version in the DB does not have a matching version number, the
   * operation aborts with an UpdateConflictException.
	 * 
	 * After the update is successful, `_version` in the object is updated to the
	 * new version number.
	 * 
	 * The version that was replaced is moved into the collection's shadow
	 * collection.
	 * 
	 * @param collection
	 * @param object
	 * @throws UpdateConflictException
	 */
	static void update(DBCollection collection, DBObject object)
			throws UpdateConflictException {
		if (!object.containsField(_VERSION))
			throw new IllegalArgumentException(
					"the base version number needs to be included as _version");

		int baseVersion = (Integer) object.get(_VERSION);

		// load the base version
		{
			DBObject base = collection.findOne(new BasicDBObject("_id",
					getId(object)));
			if (base == null) {
				throw new IllegalArgumentException(
						"document to update not found in collection");
			}
			Object bV = base.get(_VERSION);
			if (bV instanceof Integer) {
				if (baseVersion != (Integer) bV) {
					throw new UpdateConflictException(object, base);
				}
			} else {
				throw new UpdateConflictException(object, base);
			}
			// copy to shadow
			DBCollection shadow = getShadowCollection(collection);
			base.put("_id", new BasicDBObject("_id", getId(base)).append(
					_VERSION, baseVersion));
			WriteResult r = shadow.insert(base, WriteConcern.SAFE);

			// TODO: if already there, no error
			r.getLastError().throwOnError();
		}

		try {
			object.put(_VERSION, baseVersion + 1);
			DBObject found = collection.findAndModify(new BasicDBObject("_id",
					getId(object)).append(_VERSION, baseVersion), object);

			if (found == null) {
				// document has changed in the mean-time. get the latest version
				// again
				DBObject base = collection.findOne(new BasicDBObject("_id",
						getId(object)));
				if (base == null) {
					throw new IllegalArgumentException(
							"document to update not found in collection");
				}
				throw new UpdateConflictException(object, base);
			}

		} catch (RuntimeException e) {
			object.put(_VERSION, baseVersion);
			throw e;
		}

	}

	/**
	 * @return the _id property of the object
	 */
	static Object getId(BSONObject o) {
		return o.get("_id");
	}

	/**
	 * @return the version number of the object (from the _version property)
	 */

	static Integer getVersion(BSONObject o) {
		return (Integer) o.get(_VERSION);
	}

	/**
	 * @return true, if the object represents a dummy version inserted to mark a
	 *         deleted version
	 */
	static boolean isDeletedDummyVersion(BSONObject o) {
		return o.get(_VERSION).toString().startsWith("deleted:");
	}

	/**
	 * deletes the object without checking for conflicts. An existing version is
	 * moved to the shadow collection, along with a dummy version to mark the
	 * deletion. This dummy version can contain optional meta-data (such as who
	 * deleted the object, and when).
	 */
	static DBObject remove(DBCollection collection, Object id,
			BSONObject metaData) {
		DBObject base = collection.findOne(new BasicDBObject("_id", id));
		if (base == null)
			return null;

		// copy to shadow
		DBCollection shadow = getShadowCollection(collection);
		int version = getVersion(base);
		BasicDBObject revId = new BasicDBObject("_id", getId(base)).append(
				_VERSION, version);
		base.put("_id", revId);
		WriteResult r = shadow.insert(base, WriteConcern.SAFE);

		// TODO: if already there, no error
		r.getLastError().throwOnError();

		// add the dummy version
		BasicDBObject dummy = new BasicDBObject("_id", revId.append(_VERSION,
				version + 1)).append(_VERSION, "deleted:" + (version + 1));
		if (metaData != null)
			dummy.putAll(metaData);
		r = shadow.insert(dummy, WriteConcern.SAFE);
		// TODO: if already there, no error
		r.getLastError().throwOnError();

		collection.remove(new BasicDBObject("_id", id));
		return base;

	}

	/**
	 * @return the shadow collection wherein the old versions of documents are
	 *         stored
	 */
	static DBCollection getShadowCollection(DBCollection c) {
		return c.getCollection("vermongo");
	}

	/**
	 * @return an old version of the document with the given id, at the given
	 *         version number
	 */

	static DBObject getOldVersion(DBCollection c, Object id, int versionNumber) {

		BasicDBObject query = new BasicDBObject("_id", new BasicDBObject("_id",
				id).append("_version", versionNumber));

		DBObject result = getShadowCollection(c).findOne(query);
		if (result == null)
			return null;
		result.put("_id", ((BasicDBObject) getId(result)).get("_id"));
		return result;
	}

	/**
	 * The list of old versions does not include the current version of the
	 * document, but it does include dummy entries to mark the deletion (if the
	 * document was deleted). The list is ordered by version number.
	 * 
	 * @return the list of old version of the document with the given id
	 */
	static List<DBObject> getOldVersions(DBCollection c, Object id) {
		DBObject query = QueryUtils.between("_id", new BasicDBObject("_id", id)
				.append("_version", 0), new BasicDBObject("_id", id).append(
				"_version", Integer.MAX_VALUE));

		List<DBObject> result = new ArrayList<DBObject>();
		for (DBObject o : getShadowCollection(c).find(query).sort(
				new BasicDBObject("_id", 1))) {
			o.put("_id", ((BasicDBObject) getId(o)).get("_id"));
			result.add(o);
		}

		return result;
	}

}
