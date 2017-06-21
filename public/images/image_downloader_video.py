#import urllib.request
import urllib.request
import csv
import pandas as pd
import os, sys
import time

if __name__ == "__main__":
    print("Hello World")
    # with open('./naver_crawling_1.csv', 'r') as csvfile:
    #     reader = csv.reader(csvfile, delimiter=',')
    #     for row in reader:
    #         print(row)

    # f = open('./naver_crawling_1.csv', 'r')
    # csvReader = csv.reader(f)
    #
    # included_cols = [1,2,3]
    #
    # for row in csvReader:
    #     content = list(row[i] for i in included_cols)
    #     try:
    #         print(content.encode('utf-8').strip())
    #     except UnicodeEncodeError as e:
    #         print(str(e));

    # csv_file = open('./naver_crawling_1.csv', 'r')
    # reader = csv.reader(csv_file)
    # for row in reader:
    #     print(row.encode('utf-8'))

    # iter_csv = pd.read_csv('./naver_crawling_1_id.csv', iterator=True, chunksize=100)
    # df = pd.concat([chunk[chunk['brand']> 10] for chunk in iter_csv])
    #saved_column = df.ix[1]
    fields = ['video_id','youtuber_name', 'upload_date', 'description', 'thumbnail', 'title']

    df = pd.read_csv('./youtuber_videos_info3_ver1.csv', skipinitialspace=True, usecols=fields)
    # col_length = df.size/7
    col = 0
    while col <= len(df):
        if col % 1000 == 0 :
            path = "/home/ec2-user/Beauty_API_Server/public/images/video/" + str(int(col/1000));
            os.mkdir(path)
            os.chdir(path);
        try:
            print(str(col) + " success")
            urllib.request.urlretrieve(df.thumbnail[col], "video_" + str(col) + ".jpg")
        except urllib.error.HTTPError as e:
            print(str(col) + " HTTPError error")
        except ValueError as e:
            print(str(col) + " valueError error")
        col+=1
        time.sleep(1);
    # print str(df.size/7)
    #for
    #urllib.urlretrieve(df.img_src_parsing[1], df.product_name[i] + ".jpg")
    #urllib.urlretrieve("http://shopping.phinf.naver.net/main_5747371/5747371273.20130207162146.jpg", "a.jpg")
    # try:
    #     print df
    #     #print(saved_column)
    # except UnicodeDecodeError as e:
    #     print str(e)
    #     #print(str(e))

    # urllib.request.urlretrieve("http://shopping.phinf.naver.net/main_5747371/5747371273.20130207162146.jpg", "a.jpg")