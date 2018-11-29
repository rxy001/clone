import { eq } from './utils.js'

export default function ListCache() {
  this.clear()
}

ListCache.prototype.clear = listCacheClear
ListCache.prototype['delete'] = listCacheDelete
ListCache.prototype.get = listCacheGet
ListCache.prototype.has = listCacheHas
ListCache.prototype.set = listCacheSet

function listCacheClear() {
  this.__data__ = []
  this.size = 0
}

function listCacheDelete(key) {
  const data = this.__data__,
    index = assocIndexOf(data, key)

  if (index < 0) {
    return false
  }
  const lastIndex = data.length - 1
  if (index == lastIndex) {
    data.pop()
  } else {
    splice.call(data, index, 1)
  }
  --this.size
  return true
}

function listCacheGet(key) {
  var data = this.__data__,
    index = assocIndexOf(data, key)

  return index < 0 ? undefined : data[index][1]
}

function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1
}

function listCacheSet(key, value) {
  var data = this.__data__,
    index = assocIndexOf(data, key)

  if (index < 0) {
    ++this.size
    data.push([key, value])
  } else {
    data[index][1] = value
  }
  return this
}

function assocIndexOf(array, key) {
  var length = array.length
  while (length--) {
    if (eq(array[length][0], key)) {
      return length
    }
  }
  return -1
}
