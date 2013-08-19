#!/usr/bin/env python
"""Import metametrik structured files into ElasticSearch

Usage:
    import2es.py <filepath>... [--flush]
    import2es.py --dummydata
"""

import os
import simplejson

from docopt import docopt

from pyelasticsearch import ElasticSearch
from pyelasticsearch.exceptions import ElasticHttpNotFoundError


es = ElasticSearch('http://localhost:9200/')


def flush():
    try:
        es.delete_index('papers')
    except ElasticHttpNotFoundError:
        pass
    mappings = {
        'paper': {
            'properties': {
                'dependent': {"type": "string", "analyzer": "keyword"},
                'independents': {"type": "string", "analyzer": "keyword"},
                'key_independent': {"type": "string", "analyzer": "keyword"},
                'model': {'type': 'string', 'analyzer': 'keyword'},
                'journal': {'type': 'string', 'analyzer': 'keyword'},
                'keywords': {'type': 'string', 'analyzer': 'keyword'},
                'authors': {'type': 'string', 'analyzer': 'keyword'},
                'year': {'type': 'string', 'analyzer': 'keyword'},
            }
        }
    }
    es.create_index('papers', settings={'mappings': mappings})


def run(data):
    es.bulk_index('papers', 'paper', data)
    es.refresh('papers')

if __name__ == '__main__':
    arguments = docopt(__doc__)
    files = []
    if arguments['--dummydata']:
        filepath = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'sample.json'
        )
        files = [filepath]
    if arguments['<filepath>']:
        files = arguments['<filepath>']
    if arguments['--flush'] or arguments['--dummydata']:
        flush()
    es.health(wait_for_status='yellow')
    for filepath in files:
        with open(filepath) as f:
            run(simplejson.loads(f.read()))
