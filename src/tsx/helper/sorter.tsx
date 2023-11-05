export const sortByColumn = (arrayToSort, columnToSort, directionToSort) => {
  let sorted = arrayToSort.sort((a, b) => {
    if (columnToSort === 'title') {
      return a['title'].localeCompare(b['title'])
    } else if (columnToSort === 'arrangements') {
      return (a['arrangements'][0].name).localeCompare(b['arrangements'][0].name)
    } else if (columnToSort === 'tags') {
      return (a["arrangements"][0]["tags"][0]).localeCompare(b['arrangements'][0]["tags"][0])
    }
  })

  if (directionToSort === 'desc') sorted = sorted.reverse()

  return sorted
}
