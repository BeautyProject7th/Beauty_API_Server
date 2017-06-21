import urllib.request
import csv
import pandas as pd
import time
import os, sys
import math
import numpy

if __name__ == "__main__":
    print("Hello World")
    fields = ['brand', 'category_1', 'category_2', 'product_name', 'img_src']

    df = pd.read_csv('./naver_20170509.csv', skipinitialspace=True, usecols=fields)
    col_length = df.size/5
    col = 1662
    os.chdir("/home/ec2-user/Beauty_API_Server/public/images/cosmetics/1");
    while col < 8206:
        if col % 1000 == 0 :
            path = "/home/ec2-user/Beauty_API_Server/public/images/cosmetics/" + str(int(col/1000))
            os.mkdir(path)
            os.chdir(path);
        # if col % 10000 == 0 :
        #     path = "/home/ec2-user/mijeong/node/BeautyProject/public/image/cosmetics"
        #     os.mkdir(path, col/10000)
        if df.img_src[col] == "":
            col+=1
            continue
        elif pd.isnull(df.img_src[col]):
            col+=1
            continue
        print(col)
        print(df.img_src[col])
        try:
            urllib.request.urlretrieve(df.img_src[col], "cosmetics_" + str(col) + ".jpg")
        except urllib.error.HTTPError as e:
            print(str(col) + " HTTPError error")
        except ValueError as e:
            print(str(col) + " valueError error")
        #print str(col) + "/" + str(col_length)
        col+=1
        time.sleep(1)
