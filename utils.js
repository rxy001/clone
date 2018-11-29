import {
  funcTag,
  genTag,
  asyncTag,
  proxyTag,
  undefinedTag,
  nullTag,
  symbolToStringTag,
  arrayTag,
  argumentTag,
  setTag,
  mapTag
} from './tags.js'

const objectPrototype = Object.prototype
const getPrototypeOf = Object.getPrototypeOf

export const objectCreate = Object.create
export const nativeGetSymbols = Object.getOwnPropertySymbols
export const isArray = Array.isArray
export const nativeKeys = overArg(Object.keys, Object)
export const hasOwnProperty = objectPrototype.hasOwnProperty
export const toString = objectPrototype.toString
export const propertyIsEnumerable = objectPrototype.propertyIsEnumerable
export const getPrototype = overArg(getPrototypeOf, Object)

export function eq(value, other) {
  return value === other || (value !== value && other !== other)
}

export function isObject(object) {
  const type = typeof object
  return object != null && (type === 'object' || type === 'function')
}

export function isFunction(value) {
  if (!isObject(value)) {
    return false
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  const tag = getTag(value)
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag
}

export function getTag(value) {
  if (value == null) {
    value === undefined ? undefinedTag : nullTag
  }

  const symbolToStringTag = Symbol.toStringTag
  return symbolToStringTag ? getRawTag(value) : toString.call(value)
}

export function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : nativeKeys(object)
}

export function getAllKeys(object) {
  return [...keys(object), ...nativeGetSymbols(object)]
}

export function isSet(object) {
  return isObject(object) && !isFunction(object) && getTag(object) === setTag
}

export function isMap(object) {
  return isObject(object) && !isFunction(object) && getTag(object) === mapTag
}

function arrayLikeKeys(value) {
  const tag = getTag(value)
  const length = value.length
  const skipIndex = tag === arrayTag || tag === argumentTag
  const result = skipIndex ? baseTimes(length, String) : []
  for (const key in value) {
    if (hasOwnProperty.call(value, key) && !skipIndex) {
      result.push(key)
    }
  }
  return result
}

function isArrayLike(value) {
  return value !== null && isLength(value.length) && !isFunction(value)
}

function baseTimes(n, iteratee) {
  let index = -1,
    result = Array(n)

  while (++index < n) {
    result[index] = iteratee(index)
  }
  return result
}

function overArg(func, transform) {
  // 处理Object静态方法，无法将null undefined等参数转化为对象
  return function(arg) {
    return func(transform(arg))
  }
}

function getRawTag(value) {
  // value[symbolToStringTag]被重新赋值为字符串时可以修改[object ...]中的值。
  const isOwn = hasOwnProperty.call(value, symbolToStringTag)
  const tag = value[symbolToStringTag]

  value[symbolToStringTag] = undefined

  const result = toString.call(value)

  if (isOwn) {
    value[symbolToStringTag] = tag
  } else {
    delete value[symbolToStringTag]
  }
  return result
}

function isLength(length) {
  return typeof length === 'number' && length > -1 && length % 1 === 0
}
