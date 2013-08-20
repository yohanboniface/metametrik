#!/usr/bin/env python
"""Import metametrik structured files into ElasticSearch

Usage:
    import2es.py <filepath>... [--flush]
    import2es.py --dummydata
"""

import os
import simplejson
import csv

from docopt import docopt

from pyelasticsearch import ElasticSearch
from pyelasticsearch.exceptions import ElasticHttpNotFoundError


es = ElasticSearch('http://localhost:9200/')


class CSVReader(object):

    MANDATORY = [
        "dependent_variable",
        "independent_variable",
        "journal",
        "title",
        "authors",
        "standard_error",
        "coefficient",
    ]

    def __init__(self, filename, **kwargs):
        self.filename = filename
        self.kwargs = kwargs

    def __enter__(self):
        self.f = open(self.filename, 'rt', encoding='utf-8', newline='')
        data = self.f.read()
        dialect = csv.Sniffer().sniff(data)
        self.reader = csv.reader(data.split('\n'), dialect=dialect, **self.kwargs)
        self.first_row = list(map(self.formatColumnName, next(self.reader)))
        self.assertStructure()
        return self

    def formatColumnName(self, name):
        return name.lower().strip().replace(' / ', ' ').replace(' ', '_')

    def assertStructure(self):
        for col in self.MANDATORY:
            msg = "Missing or misnamed «{col}» column".format(col=col)
            assert col in self.first_row, msg

    def __exit__(self, type, value, traceback):
        self.f.close()

    def format(self, row):
        row = dict(zip(self.first_row, row))
        lists = [
            'authors',
            'other_independent_variables_controls',
            'keywords',
            'jel_code'
        ]
        for field in lists:
            try:
                row[field] = row[field].split(';')
            except KeyError:
                pass
        for col in self.MANDATORY:
            assert col in row and row[col] != ''
        return row

    def next(self):
        row = next(self.reader)
        try:
            row = self.format(row)
        except AssertionError:
            row = self.next()
        return row

    __next__ = next

    def __iter__(self):
        return self


def from_csv(filepath):
    output = []
    with CSVReader(filepath) as f:
        for row in f:
            output.append(row)
    return output


def from_json(filepath):
    with open(filepath) as f:
        return simplejson.loads(f.read())


def flush():
    try:
        es.delete_index('papers')
    except ElasticHttpNotFoundError:
        pass
    mappings = {
        'paper': {
            'properties': {
                'dependent_variable': {"type": "string", "analyzer": "keyword"},
                'independent_variable': {"type": "string", "analyzer": "keyword"},
                'other_independent_variables_controls': {"type": "string", "analyzer": "keyword"},
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
        _, ext = os.path.splitext(filepath)
        if ext == ".csv":
            data = from_csv(filepath)
        elif ext == ".json":
            data = from_json(filepath)
        else:
            raise ValueError('Unkown extension {ext}'.format(ext=ext))
        run(data)
