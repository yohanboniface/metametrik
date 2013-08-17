#!/usr/bin/env python

import os
import simplejson

from pyelasticsearch import ElasticSearch

es = ElasticSearch('http://localhost:9200/')


def run(data):
    es.delete_index('papers')
    mapping = {
        'paper': {
        }
    }
    mapping = {
        'paper': {
            'properties': {
                'dependent': {"type": "string", "analyzer": "keyword"},
                'independents': {"type": "string", "analyzer": "keyword"},
                'key_independent': {"type": "string", "analyzer": "keyword"},
                'model': {'type': 'string', 'analyzer': 'keyword'},
                'journal': {'type': 'string', 'analyzer': 'keyword'},
                'keywords': {'type': 'string', 'analyzer': 'keyword'},
                'authors': {'type': 'string', 'analyzer': 'keyword'},
                'year': {'type': 'date', 'analyzer': 'keyword'},
            }
        }
    }
    es.create_index('papers', settings={'mappings': mapping})
    es.health(wait_for_status='yellow')
    es.bulk_index('papers', 'paper', data)
    es.refresh('papers')

if __name__ == '__main__':
    filepath = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'sample.json'
    )
    with open(filepath) as f:
        run(simplejson.loads(f.read()))
